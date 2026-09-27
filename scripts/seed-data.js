import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!serviceKey || !supabaseUrl) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v.length) {
          const key = k.trim();
          const val = v.join('=').trim();
          if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !serviceKey) serviceKey = val;
          if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !supabaseUrl) supabaseUrl = val;
        }
      });
    }
  } catch (e) {}
}

const SUPABASE_URL = supabaseUrl || 'https://svokziffvhjxqktkuvdd.supabase.co';
const SERVICE_KEY = serviceKey || '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  {
    email: 'sarah.chen@flowgrid.io',
    password: 'Password123!',
    fullName: 'Sarah Chen',
    username: 'sarah_chen',
    roleTitle: 'Product Lead',
    timezone: 'utc-5',
  },
  {
    email: 'alex.rivera@flowgrid.io',
    password: 'Password123!',
    fullName: 'Alex Rivera',
    username: 'alex_rivera',
    roleTitle: 'Senior Frontend Engineer',
    timezone: 'utc-5',
  },
  {
    email: 'marcus.taylor@flowgrid.io',
    password: 'Password123!',
    fullName: 'Marcus Taylor',
    username: 'marcus_taylor',
    roleTitle: 'Backend & Cloud Architect',
    timezone: 'utc',
  },
  {
    email: 'elena.rostova@flowgrid.io',
    password: 'Password123!',
    fullName: 'Elena Rostova',
    username: 'elena_rostova',
    roleTitle: 'Product Designer',
    timezone: 'utc+1',
  },
];

async function seed() {
  console.log('🌱 Starting Flowgrid test data seeding...\n');

  const createdUserIds = {};

  // 1. Create Users
  console.log('👤 Creating test users...');
  for (const u of TEST_USERS) {
    // Check if user already exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users?.find((x) => x.email === u.email);

    let uid = existing?.id;
    if (!existing) {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.fullName,
          name: u.fullName,
          username: u.username,
        },
      });

      if (createErr) {
        console.error(`Failed to create ${u.email}:`, createErr.message);
        continue;
      }
      uid = newUser.user.id;
      console.log(`  ✓ Created user: ${u.fullName} (${u.email})`);
    } else {
      console.log(`  ℹ User already exists: ${u.fullName} (${u.email})`);
    }

    createdUserIds[u.username] = uid;

    // Ensure Profile row is populated
    await supabase.from('profiles').upsert({
      id: uid,
      email: u.email,
      full_name: u.fullName,
      username: u.username,
      role_title: u.roleTitle,
      job_title: u.roleTitle,
      timezone: u.timezone,
      email_verified: true,
    }, { onConflict: 'id' });

    // Seed default preferences
    await supabase.from('user_preferences').upsert({
      user_id: uid,
      theme: 'system',
      default_task_view: 'board',
      email_notifications: true,
      push_notifications: true,
      task_updates: true,
    }, { onConflict: 'user_id' });
  }

  const sarahId = createdUserIds['sarah_chen'];
  const alexId = createdUserIds['alex_rivera'];
  const marcusId = createdUserIds['marcus_taylor'];
  const elenaId = createdUserIds['elena_rostova'];

  if (!sarahId || !alexId || !marcusId || !elenaId) {
    console.error('❌ Could not resolve all user IDs. Exiting.');
    return;
  }

  // 2. Workspaces
  console.log('\n🏢 Creating workspaces...');
  
  // Workspace 1: Acme Cloud Platform
  const { data: ws1, error: ws1Err } = await supabase
    .from('workspaces')
    .insert({
      name: 'Acme Cloud Platform',
      slug: 'acme-cloud',
      description: 'Modern infrastructure and workspace management platform.',
      owner_id: sarahId,
    })
    .select()
    .single();

  if (ws1Err) {
    console.error('Failed to create Workspace 1:', ws1Err.message);
    return;
  }
  console.log(`  ✓ Created workspace: ${ws1.name}`);

  // Workspace 2: Nebula Design Studio
  const { data: ws2, error: ws2Err } = await supabase
    .from('workspaces')
    .insert({
      name: 'Nebula Design Studio',
      slug: 'nebula-design',
      description: 'Brand identity, typography tokens, and design system redesign.',
      owner_id: elenaId,
    })
    .select()
    .single();

  if (ws2Err) {
    console.error('Failed to create Workspace 2:', ws2Err.message);
    return;
  }
  console.log(`  ✓ Created workspace: ${ws2.name}`);

  // 3. Workspace Memberships
  console.log('\n👥 Adding workspace members...');
  const memberships = [
    // Acme Cloud Platform members
    { workspace_id: ws1.id, user_id: sarahId, role: 'owner' },
    { workspace_id: ws1.id, user_id: alexId, role: 'admin' },
    { workspace_id: ws1.id, user_id: marcusId, role: 'member' },
    { workspace_id: ws1.id, user_id: elenaId, role: 'member' },
    // Nebula Studio members
    { workspace_id: ws2.id, user_id: elenaId, role: 'owner' },
    { workspace_id: ws2.id, user_id: sarahId, role: 'admin' },
    { workspace_id: ws2.id, user_id: alexId, role: 'member' },
  ];

  for (const m of memberships) {
    await supabase.from('workspace_members').upsert(m, { onConflict: 'workspace_id, user_id' });
  }
  console.log('  ✓ Members linked with roles (owner, admin, member).');

  // 4. Projects
  console.log('\n📁 Creating projects...');
  const { data: proj1 } = await supabase
    .from('projects')
    .insert({
      workspace_id: ws1.id,
      name: 'Q4 Core Platform Modernization',
      description: 'Migrate legacy microservices and optimize real-time event feeds.',
      created_by: sarahId,
    })
    .select()
    .single();

  const { data: proj2 } = await supabase
    .from('projects')
    .insert({
      workspace_id: ws1.id,
      name: 'Mobile Experience & PWA',
      description: 'Deliver responsive mobile navigation, offline support, and push notifications.',
      created_by: alexId,
    })
    .select()
    .single();

  const { data: proj3 } = await supabase
    .from('projects')
    .insert({
      workspace_id: ws2.id,
      name: 'Design System 2.0',
      description: 'Dark-mode color scales, typography primitives, and interactive UI component library.',
      created_by: elenaId,
    })
    .select()
    .single();

  console.log(`  ✓ Created projects: ${proj1.name}, ${proj2.name}, ${proj3.name}`);

  // 5. Tasks (Kanban board)
  console.log('\n📋 Creating Kanban tasks...');
  const now = new Date();
  const today = now.toISOString();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const tasks = [
    // Project 1 Tasks
    {
      project_id: proj1.id,
      workspace_id: ws1.id,
      title: 'Refactor database connection pooling for high load',
      description: 'Analyze pgBouncer transaction limits and benchmark sub-40ms query execution.',
      priority: 'P1',
      status: 'todo',
      due_date: today,
      creator_id: sarahId,
      assignee_id: marcusId,
    },
    {
      project_id: proj1.id,
      workspace_id: ws1.id,
      title: 'Implement OAuth session revocation telemetry',
      description: 'Log security audit events upon credential rotation or concurrent logouts.',
      priority: 'P2',
      status: 'todo',
      due_date: nextWeek,
      creator_id: sarahId,
      assignee_id: alexId,
    },
    {
      project_id: proj1.id,
      workspace_id: ws1.id,
      title: 'Optimize real-time board state subscriptions',
      description: 'Ensure TanStack Query cache invalidations sync across active browser tabs.',
      priority: 'P2',
      status: 'in_progress',
      due_date: nextWeek,
      creator_id: alexId,
      assignee_id: alexId,
    },
    {
      project_id: proj1.id,
      workspace_id: ws1.id,
      title: 'Setup Supabase database schema and RLS policies',
      description: 'Configure multi-tenant isolation, row level security, and auto-profile triggers.',
      priority: 'P1',
      status: 'done',
      due_date: today,
      creator_id: marcusId,
      assignee_id: marcusId,
    },
    {
      project_id: proj1.id,
      workspace_id: ws1.id,
      title: 'Configure automated avatar storage bucket',
      description: 'Provision profile-images bucket with public read permissions and user upsert policies.',
      priority: 'P3',
      status: 'done',
      due_date: today,
      creator_id: marcusId,
      assignee_id: marcusId,
    },

    // Project 2 Tasks (Mobile)
    {
      project_id: proj2.id,
      workspace_id: ws1.id,
      title: 'Build responsive notification dropdown with unread badge',
      description: 'Optimized touch targets and full-width layout for mobile screens under 420px.',
      priority: 'P1',
      status: 'in_progress',
      due_date: today,
      creator_id: alexId,
      assignee_id: alexId,
    },
    {
      project_id: proj2.id,
      workspace_id: ws1.id,
      title: 'Test offline optimistic UI updates for card dragging',
      description: 'Verify smooth drag-and-drop feedback with fallback toast on network drop.',
      priority: 'P2',
      status: 'todo',
      due_date: nextWeek,
      creator_id: alexId,
      assignee_id: alexId,
    },

    // Project 3 Tasks (Design System)
    {
      project_id: proj3.id,
      workspace_id: ws2.id,
      title: 'Design dark-mode contrast tokens for WCAG AA compliance',
      description: 'Review contrast ratios for brand-accent and dimmed text tokens.',
      priority: 'P2',
      status: 'in_progress',
      due_date: today,
      creator_id: elenaId,
      assignee_id: elenaId,
    },
    {
      project_id: proj3.id,
      workspace_id: ws2.id,
      title: 'Create Kanban drag-and-drop wireframes',
      description: 'Finalize column headers, priority badges, and multi-assignee avatar stacks.',
      priority: 'P3',
      status: 'done',
      due_date: today,
      creator_id: elenaId,
      assignee_id: elenaId,
    },
  ];

  for (const t of tasks) {
    await supabase.from('tasks').insert(t);
  }
  console.log(`  ✓ Created ${tasks.length} tasks across To Do, In Progress, and Done.`);

  // 6. Chat Threads & Messages
  console.log('\n💬 Creating chat threads and messages...');
  const { data: thread1 } = await supabase
    .from('message_threads')
    .insert({
      workspace_id: ws1.id,
      title: 'General Team Sync',
      created_by: sarahId,
    })
    .select()
    .single();

  const { data: thread2 } = await supabase
    .from('message_threads')
    .insert({
      workspace_id: ws1.id,
      title: 'Platform Architecture & Performance',
      created_by: marcusId,
    })
    .select()
    .single();

  // Add thread participants
  await supabase.from('thread_participants').upsert([
    { thread_id: thread1.id, user_id: sarahId, is_admin: true },
    { thread_id: thread1.id, user_id: alexId, is_admin: false },
    { thread_id: thread1.id, user_id: marcusId, is_admin: false },
    { thread_id: thread1.id, user_id: elenaId, is_admin: false },
    { thread_id: thread2.id, user_id: marcusId, is_admin: true },
    { thread_id: thread2.id, user_id: sarahId, is_admin: false },
    { thread_id: thread2.id, user_id: alexId, is_admin: false },
  ], { onConflict: 'thread_id, user_id' });

  // Messages in General
  const generalMessages = [
    { thread_id: thread1.id, workspace_id: ws1.id, author_id: sarahId, body: 'Welcome to Flowgrid team! All our Q4 platform sprints and boards live right here.' },
    { thread_id: thread1.id, workspace_id: ws1.id, author_id: alexId, body: 'Loving the real-time Kanban drag-and-drop! Working on the mobile notification drawer right now.' },
    { thread_id: thread1.id, workspace_id: ws1.id, author_id: elenaId, body: 'The dark-mode palette and typography hierarchy look super sharp across all displays.' },
    { thread_id: thread1.id, workspace_id: ws1.id, author_id: marcusId, body: 'Database schemas, RLS isolation policies, and trigger pipelines are all verified and active.' },
  ];

  // Messages in Architecture
  const archMessages = [
    { thread_id: thread2.id, workspace_id: ws1.id, author_id: sarahId, body: 'Marcus, how are the connection latency numbers looking for task transitions?' },
    { thread_id: thread2.id, workspace_id: ws1.id, author_id: marcusId, body: 'Benchmark results are under 40ms average response time! Real-time subscriptions are rock solid.' },
  ];

  for (const m of [...generalMessages, ...archMessages]) {
    await supabase.from('messages').insert(m);
  }
  console.log('  ✓ Created 2 chat threads with realistic team messages.');

  // 7. Notifications
  console.log('\n🔔 Generating sample notifications...');
  const sampleNotifications = [
    {
      user_id: alexId,
      type: 'task_assigned',
      workspace_id: ws1.id,
      title: 'Task Assigned',
      body: 'Sarah assigned you to: Implement OAuth session revocation telemetry',
      is_read: false,
    },
    {
      user_id: marcusId,
      type: 'task_assigned',
      workspace_id: ws1.id,
      title: 'Task Assigned',
      body: 'Sarah assigned you to: Refactor database connection pooling for high load',
      is_read: false,
    },
    {
      user_id: sarahId,
      type: 'message',
      workspace_id: ws1.id,
      ref_id: thread2.id,
      title: 'New Message',
      body: 'Marcus replied in Platform Architecture & Performance',
      is_read: false,
    },
  ];

  for (const n of sampleNotifications) {
    await supabase.from('notifications').insert(n);
  }
  console.log('  ✓ Created in-app notifications for team members.');

  console.log('\n🎉 Seeding complete! All test accounts and data are ready to use.');
}

seed().catch(console.error);
