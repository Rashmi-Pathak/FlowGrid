import { execSync } from 'child_process';

const commits = [
  { files: ['.gitignore'], msg: 'chore: initialize repository and configure gitignore rules' },
  { files: ['package.json'], msg: 'build: configure Flowgrid package dependencies and scripts' },
  { files: ['package-lock.json'], msg: 'build: add lockfile for deterministic dependency tree' },
  { files: ['tsconfig.json'], msg: 'chore: configure strict TypeScript compiler options and path aliases' },
  { files: ['next.config.ts'], msg: 'config: set up Next.js configuration' },
  { files: ['postcss.config.mjs'], msg: 'style: configure PostCSS and Tailwind CSS plugin' },
  { files: ['eslint.config.mjs'], msg: 'lint: set up ESLint flat configuration for Next.js and TypeScript' },
  { files: ['components.json'], msg: 'ui: configure shadcn/ui component generator schema' },
  { files: ['proxy.ts'], msg: 'network: configure local proxy handler' },
  { files: ['env.example'], msg: 'config: document required environment variables in env.example' },
  { files: ['LICENSE'], msg: 'docs: preserve original copyright license and terms' },
  { files: ['public/file.svg', 'public/globe.svg', 'public/next.svg', 'public/vercel.svg', 'public/window.svg'], msg: 'assets: add static SVG iconography' },
  { files: ['public/FlowFoundry.png'], msg: 'assets: add banner preview image asset' },
  { files: ['app/globals.css'], msg: 'style: define design system CSS variables, themes, and keyframe animations' },
  { files: ['app/favicon.ico'], msg: 'assets: add application favicon' },
  { files: ['app/layout.tsx'], msg: 'feat(layout): implement RootLayout with Geist fonts, ThemeProvider, and sonner' },
  { files: ['utils/supabase/client.ts'], msg: 'feat(supabase): create browser Supabase client with SSR support' },
  { files: ['utils/supabase/server.ts'], msg: 'feat(supabase): create server-side Supabase client with cookie handlers' },
  { files: ['utils/supabase/admin.ts'], msg: 'feat(supabase): add privileged admin client utilizing service role key' },
  { files: ['utils/supabase/proxy.ts'], msg: 'feat(supabase): add proxy helper for Supabase communication' },
  { files: ['utils/userDisplay.ts'], msg: 'utils: add display name resolution and fallback formatting' },
  { files: ['utils/permissions.ts'], msg: 'utils: add role-based permission verification logic' },
  { files: ['lib/utils.ts'], msg: 'utils: add cn class variance helper utility' },
  { files: ['lib/time.ts'], msg: 'utils: add relative time and smart due date calculation functions' },
  { files: ['lib/clipboard.ts'], msg: 'utils: implement clipboard copy helper with error handling' },
  { files: ['lib/useLocalStorage.ts'], msg: 'hooks: implement reactive local storage state hook' },
  { files: ['lib/memberProfileSync.ts'], msg: 'feat: add member profile synchronization routines' },
  { files: ['lib/validation/schemas.ts'], msg: 'validation: create Zod validation schemas for auth, profile, and projects' },
  { files: ['lib/validation/sanitize.ts'], msg: 'validation: add input sanitization routines for email and username' },
  { files: ['lib/validation/middleware.ts'], msg: 'validation: add request validation middleware helper' },
  { files: ['lib/validation/index.ts', 'lib/validation/README.md'], msg: 'validation: export validation modules and provide documentation' },
  { files: ['types/workspaces.ts'], msg: 'types: define TypeScript interfaces for workspaces, tasks, and notifications' },
  { files: ['types/profile.ts'], msg: 'types: define TypeScript interfaces and Zod schemas for user profile' },
  { files: ['components/providers/ThemeProvider.tsx'], msg: 'ui(providers): implement next-themes ThemeProvider wrapper' },
  { files: ['app/providers/QueryProvider.tsx'], msg: 'ui(providers): implement TanStack React Query provider' },
  { files: ['app/context/ContextApiProvider.tsx'], msg: 'context: create AuthContext and session state provider' },
  { files: ['components/ui/button.tsx'], msg: 'ui: implement Button component with cva variant system' },
  { files: ['components/ui/input.tsx'], msg: 'ui: implement Input component with dark-mode styling' },
  { files: ['components/ui/label.tsx'], msg: 'ui: implement Label primitive' },
  { files: ['components/ui/card.tsx'], msg: 'ui: implement Card, CardHeader, CardContent, and CardFooter primitives' },
  { files: ['components/ui/badge.tsx'], msg: 'ui: implement Badge component with multiple color variants' },
  { files: ['components/ui/avatar.tsx'], msg: 'ui: implement Avatar and AvatarFallback components' },
  { files: ['components/ui/dialog.tsx'], msg: 'ui: implement modal Dialog primitives based on Radix UI' },
  { files: ['components/ui/confirmation-dialog.tsx'], msg: 'ui: implement reusable ConfirmationDialog with async actions' },
  { files: ['components/ui/dropdown-menu.tsx'], msg: 'ui: implement DropdownMenu primitives' },
  { files: ['components/ui/checkbox.tsx'], msg: 'ui: implement Checkbox component' },
  { files: ['components/ui/switch.tsx'], msg: 'ui: implement Switch toggle component' },
  { files: ['components/ui/popover.tsx'], msg: 'ui: implement Popover primitives' },
  { files: ['components/ui/command.tsx'], msg: 'ui: implement Command search palette using cmdk' },
  { files: ['components/ui/select.tsx'], msg: 'ui: implement Select dropdown primitives' },
  { files: ['components/ui/separator.tsx'], msg: 'ui: implement Separator component' },
  { files: ['components/ui/tabs.tsx'], msg: 'ui: implement Tabs navigation primitives' },
  { files: ['components/ui/textarea.tsx'], msg: 'ui: implement Textarea component' },
  { files: ['components/ui/form.tsx'], msg: 'ui: implement Form context and Field wrapper using React Hook Form' },
  { files: ['components/ui/skeleton.tsx'], msg: 'ui: implement Skeleton placeholder animation component' },
  { files: ['components/ui/sonner.tsx'], msg: 'ui: implement Sonner toast provider and styling' },
  { files: ['hooks/useProjects.ts'], msg: 'hooks: implement useProjects hook with pagination and search' },
  { files: ['hooks/useWorkspaces.ts'], msg: 'hooks: implement useWorkspaces hook with real-time subscriptions' },
  { files: ['lib/chatAccess.ts'], msg: 'feat(chat): add chat access verification and cursor-based thread queries' },
  { files: ['lib/workspaces.ts'], msg: 'feat(workspaces): add workspace management and invitation service' },
  { files: ['lib/notifications/types.ts', 'lib/notifications/subscribe.ts'], msg: 'feat(notifications): add notification types and real-time subscription listener' },
  { files: ['utils/supabase/notifications.ts'], msg: 'feat(notifications): add Supabase notification query helpers' },
  { files: ['utils/supabase/profile.ts'], msg: 'feat(profile): add user profile retrieval and avatar upload functions' },
  { files: ['utils/supabase/appActions.ts'], msg: 'feat(actions): add common Supabase database actions' },
  { files: ['app/actions/AuthActions.ts'], msg: 'feat(auth): implement SignIn, SignUp, SignOut, and ResetPassword server actions' },
  { files: ['components/Navbar.tsx'], msg: 'feat(navbar): implement global Navbar with Flowgrid logo, profile chip, and responsive menu' },
  { files: ['components/notifications/NotificationBell.tsx', 'components/notifications/NotificationsList.tsx'], msg: 'feat(notifications): implement NotificationBell with unread counter and deep linking' },
  { files: ['components/profile/NotificationPreferences.tsx'], msg: 'feat(profile): implement NotificationPreferences settings form' },
  { files: ['components/projects/CreateProjectDialog.tsx', 'components/projects/EditProjectMenu.tsx'], msg: 'feat(projects): implement CreateProjectDialog and project settings menu' },
  { files: ['components/tasks/TaskAssignees.tsx', 'components/tasks/CreateTaskDialog.tsx'], msg: 'feat(tasks): implement CreateTaskDialog with multi-assignee and priority selection' },
  { files: ['components/chat/UserSelectionDialog.tsx'], msg: 'feat(chat): implement UserSelectionDialog for initiating discussions' },
  { files: ['components/chat/ThreadList.tsx'], msg: 'feat(chat): implement ThreadList with unread badges and active state' },
  { files: ['components/chat/MessagePanel.tsx'], msg: 'feat(chat): implement real-time MessagePanel with message threads and participant management' },
  { files: ['components/workspaces/CreateWorkspaceDialog.tsx'], msg: 'feat(workspaces): implement CreateWorkspaceDialog' },
  { files: ['components/workspaces/InviteUser.tsx', 'components/workspaces/InvitationAccept.tsx'], msg: 'feat(workspaces): implement workspace invitation management components' },
  { files: ['app/api/notifications/route.ts', 'app/api/notifications/clear/route.ts', 'app/api/notifications/fanout/route.ts', 'app/api/notifications/mark-all-read/route.ts', 'app/api/notifications/mark-read/route.ts'], msg: 'api: implement notification endpoints (fetch, fanout, clear, mark-read)' },
  { files: ['app/api/profile/route.ts', 'app/api/profile/avatar/route.ts', 'app/api/profile/delete/route.ts', 'app/api/profile/export/route.ts', 'app/api/profile/oauth/route.ts', 'app/api/profile/sessions/route.ts'], msg: 'api: implement profile management and user session endpoints' },
  { files: ['app/api/users/lookup/route.ts', 'app/api/users/search/route.ts', 'app/api/users/by-ids/route.ts'], msg: 'api: implement user discovery and profile resolution endpoints' },
  { files: ['app/api/workspaces/leave/route.ts', 'app/api/workspaces/invitations/route.ts', 'app/api/workspaces/invitations/accept/route.ts', 'app/api/workspaces/invitations/decline/route.ts'], msg: 'api: implement workspace membership and invitation actions' },
  { files: ['app/auth/callback/route.ts'], msg: 'feat(auth): implement auth callback exchange and profile provisioning' },
  { files: ['app/auth/reset-password/page.tsx'], msg: 'feat(auth): add password reset update page' },
  { files: ['app/(pages)/(auth)/forgot-password/page.tsx'], msg: 'feat(auth): implement forgot password request screen' },
  { files: ['app/(pages)/(auth)/login/page.tsx'], msg: 'feat(auth): implement clean email/password login page with Flowgrid branding' },
  { files: ['app/(pages)/(auth)/register/page.tsx'], msg: 'feat(auth): implement user registration page with workspace onboarding steps' },
  { files: ['app/(pages)/profile/page.tsx'], msg: 'feat(profile): implement comprehensive profile settings with theme and session management' },
  { files: ['app/workspaces/page.tsx', 'app/workspaces/[id]/people/page.tsx'], msg: 'feat(workspaces): implement workspaces overview and people directory' },
  { files: ['app/workspaces/[id]/messages/page.tsx'], msg: 'feat(chat): implement workspace chat and messaging view' },
  { files: ['app/projects/page.tsx', 'app/projects/[id]/page.tsx'], msg: 'feat(projects): implement projects list and project overview dashboard' },
  { files: ['app/projects/[id]/tasks/page.tsx'], msg: 'feat(tasks): implement interactive Kanban board with drag-and-drop state updates' },
  { files: ['app/tasks/page.tsx'], msg: 'feat(tasks): implement global task management dashboard' },
  { files: ['app/invitations/page.tsx', 'app/invite/[token]/page.tsx'], msg: 'feat(invitations): implement token-based workspace invite accept and decline flow' },
  { files: ['app/page.tsx'], msg: 'feat(landing): implement Flowgrid marketing landing page with live interactive preview' },
  { files: ['build.log', '.tmp/next-dev.err.log', '.tmp/next-dev.out.log'], msg: 'chore: preserve source build artifacts and developer logs' },
  { files: ['scripts/check-supabase.js', 'scripts/check-db-schema.ts', 'scripts/test-avatar-upload.ts'], msg: 'scripts: add database and storage health check verification scripts' },
  { files: ['supabase-schema.sql'], msg: 'db: define complete Flowgrid schema, tables, triggers, and RLS security policies' },
  { files: ['scripts/fix-rls.sql'], msg: 'db: add recursion-free RLS helper functions and policy patch' },
  { files: ['scripts/seed-data.js'], msg: 'db(seed): add automated test user and collaborative workspace seeding script' },
  { files: ['README.md'], msg: 'docs: update project documentation and installation guide for Flowgrid' },
];

console.log(`Starting ${commits.length} commits...`);

for (let i = 0; i < commits.length; i++) {
  const { files, msg } = commits[i];
  for (const f of files) {
    execSync(`git add "${f}"`, { stdio: 'inherit' });
  }
  // Check if anything is staged
  const status = execSync('git status --porcelain').toString();
  if (status.trim().length > 0) {
    execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });
    console.log(`[${i + 1}/${commits.length}] ${msg}`);
  } else {
    console.log(`[${i + 1}/${commits.length}] (Skipped, already committed) ${msg}`);
  }
}

// Stage any remaining files if any exist
const finalStatus = execSync('git status --porcelain').toString();
if (finalStatus.trim().length > 0) {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "chore: finalize project setup and configuration"', { stdio: 'inherit' });
  console.log('Final commit created for remaining untracked files.');
}

console.log('Done creating commits!');
