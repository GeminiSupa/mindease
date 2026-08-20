import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthorizedAdmin } from '../auth';

export async function POST(req: Request) {
  try {
    const admin = await getAuthorizedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Clinic data service is not configured' },
        { status: 503 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await req.json();
    const name = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // 1. Create the user in Supabase Auth
    // We send an invite email which allows them to set their password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name,
        role: 'therapist'
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Add them to the public.profiles table (handled automatically by a trigger in some setups, 
    // but doing it explicitly here for the 'therapist' role if needed, depending on exact schema).
    // Based on mindease-admin-schema.sql, we should insert them into profiles if the trigger didn't.
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name: name,
      email: email,
      role: 'therapist'
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Add a placeholder row in public.therapists
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const { data: therapist, error: therapistError } = await supabaseAdmin.from('therapists').insert({
      user_id: userId,
      full_name: name,
      slug: slug + '-' + userId.substring(0, 5), // Ensure unique slug
      title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Clinical Psychologist',
      qualifications: typeof body.qualifications === 'string' ? body.qualifications.trim() : '',
      specialization: typeof body.specialization === 'string' ? body.specialization.trim() : '',
      languages: typeof body.languages === 'string'
        ? body.languages.split(',').map((item: string) => item.trim()).filter(Boolean)
        : ['Urdu', 'English'],
      years_experience: Math.max(0, Number(body.yearsExperience) || 0),
      session_fee: Math.max(0, Number(body.sessionFee) || 0),
      profile_image_url: typeof body.profileImageUrl === 'string' ? body.profileImageUrl.trim() : '',
      bio: typeof body.bio === 'string' ? body.bio.trim() : '',
      approval_status: 'pending',
      availability_status: 'Pending admin review',
      is_active: false
    }).select().single();

    if (therapistError) {
      // Cleanup if failed
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: therapistError.message }, { status: 500 });
    }

    await supabaseAdmin.from('admin_audit_logs').insert({
      actor_id: admin.id,
      action: 'therapist.invited',
      entity_table: 'therapists',
      entity_id: therapist.id,
      metadata: { email },
    });

    return NextResponse.json({
      success: true,
      therapist,
      message: 'Therapist invited successfully',
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
