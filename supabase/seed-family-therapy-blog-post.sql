-- Run in Supabase SQL Editor to publish the family therapy blog post in production.
insert into public.blog_posts (
  slug,
  title,
  excerpt,
  body,
  image_url,
  status,
  published_at
)
values (
  'family-therapy-online-eft-approach',
  'Family therapy online: how an EFT-informed approach works',
  'How couples and families work through conflict, trust, and communication patterns in secure video sessions—with structured EFT-informed support and clear care coordination.',
  $$Family therapy can help when communication breaks down, trust feels fragile, or the same arguments keep returning. At MindEase, this work happens fully online through secure video sessions.

**What family therapy focuses on**
- Recurring conflict, distance, or emotional disconnection
- Parenting stress, academic pressure, or family transitions
- Rebuilding trust after hurt, betrayal, or major life change
- Creating clearer boundaries and safer ways to talk

**An EFT-informed approach**
Emotionally Focused Therapy (EFT) looks at the emotional patterns beneath arguments. Instead of only solving the latest disagreement, therapy helps family members understand what each person is needing, fearing, or trying to protect. That often makes conversations feel less blaming and more workable.

**How online sessions work at MindEase**
1. You share your concern privately with the care coordinator.
2. We match you with a therapist whose focus, language, and fee fit your situation.
3. Sessions take place by video, with guidance on privacy, timing, and who joins each session.
4. Follow-ups and rescheduling stay simple through one care contact.

Online family therapy can work well when everyone has a private space, a stable connection, and clear expectations before the session begins. If you are unsure whether family therapy is the right next step, you can also start with a self-check or send a short message to the care coordinator.$$,
  'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&q=80&w=900&h=540',
  'published',
  now()
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  image_url = excluded.image_url,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();
