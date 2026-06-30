-- Create custom enums if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_type_enum') THEN
        CREATE TYPE member_type_enum AS ENUM ('admin', 'master', 'mentor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status_enum') THEN
        CREATE TYPE member_status_enum AS ENUM ('Ativo', 'Inativo');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_event_type') THEN
        CREATE TYPE calendar_event_type AS ENUM ('mentoria', 'atualizacao');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('mentoria', 'atualizacao', 'masterclass', 'oportunidade', 'recurso');
    END IF;
END$$;

-- Table: public.members
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT,
    company TEXT,
    industry TEXT,
    location TEXT,
    initials TEXT,
    img TEXT,
    bio TEXT,
    username TEXT UNIQUE,
    member_type member_type_enum DEFAULT 'mentor'::member_type_enum,
    theme TEXT DEFAULT 'dark',
    status member_status_enum DEFAULT 'Ativo'::member_status_enum,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deactivated_at TIMESTAMP WITH TIME ZONE
);

-- Table: public.courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    status TEXT DEFAULT 'rascunho',
    sequence_order INTEGER DEFAULT 0,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    status TEXT DEFAULT 'published',
    sequence_order INTEGER DEFAULT 0,
    slug TEXT UNIQUE NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    duration TEXT NOT NULL,
    video_url TEXT,
    thumbnail_url TEXT,
    cover_image_url TEXT,
    instructor_name TEXT,
    instructor_role TEXT,
    instructor_avatar TEXT,
    status TEXT DEFAULT 'published',
    sequence_order INTEGER DEFAULT 0,
    slug TEXT UNIQUE NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.resources
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT CHECK (category IN ('spreadsheet', 'document', 'presentation', 'other')),
    description TEXT,
    file_url TEXT NOT NULL,
    format TEXT,
    size TEXT,
    available_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.member_connections
CREATE TABLE IF NOT EXISTS public.member_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_connection UNIQUE (requester_id, receiver_id),
    CONSTRAINT no_self_connection CHECK (requester_id <> receiver_id)
);

-- Table: public.community_posts
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    author_role TEXT,
    content TEXT,
    image_url TEXT,
    video_url TEXT,
    likes_count INTEGER DEFAULT 0,
    liked_by_users UUID[] DEFAULT '{}',
    saved_by_users UUID[] DEFAULT '{}',
    comments JSONB DEFAULT '[]'::jsonb,
    post_type TEXT DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.lesson_comments
CREATE TABLE IF NOT EXISTS public.lesson_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type notification_type NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.calendar_events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_type calendar_event_type NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    mentor_name TEXT,
    mentor_role TEXT,
    mentor_avatar TEXT,
    mentor_bio TEXT,
    topic TEXT,
    zoom_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.ecosystem_banners
CREATE TABLE IF NOT EXISTS public.ecosystem_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    tag TEXT,
    image TEXT NOT NULL,
    cta_text TEXT NOT NULL,
    cta_link TEXT NOT NULL,
    disabled BOOLEAN DEFAULT FALSE,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.missions
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    has_text_question BOOLEAN DEFAULT FALSE,
    text_question TEXT,
    has_form_link BOOLEAN DEFAULT FALSE,
    form_link TEXT,
    has_file_upload BOOLEAN DEFAULT FALSE,
    file_upload_label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.mission_submissions
CREATE TABLE IF NOT EXISTS public.mission_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    text_answer TEXT,
    form_submitted_link TEXT,
    file_url TEXT,
    file_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    CONSTRAINT unique_mission_submission UNIQUE (mission_id, student_id)
);

-- Table: public.story_views
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_story_view UNIQUE (story_id, viewer_id)
);

-- Table: public.investment_opportunities
CREATE TABLE IF NOT EXISTS public.investment_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT,
    description TEXT,
    long_description TEXT,
    image_url TEXT,
    badge TEXT,
    target_irr TEXT,
    min_investment TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: public.user_lesson_progress
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    total_seconds INTEGER DEFAULT 0,
    percent_complete INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_user_lesson UNIQUE (user_id, lesson_id)
);

-- Table: public.webhook_logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    email TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Dynamic type getter function (RLS helpers)
CREATE OR REPLACE FUNCTION public.get_member_type()
RETURNS member_type_enum AS $$
    SELECT member_type FROM public.members WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Add basic RLS policies for active access controls
CREATE POLICY "Public profiles are visible to all authenticated users"
ON public.members FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Users can update their own profiles"
ON public.members FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
ON public.members FOR ALL TO authenticated USING (public.get_member_type() = 'admin');

CREATE POLICY "Courses visible to active users"
ON public.courses FOR SELECT TO authenticated USING (
    public.get_member_type() = 'admin' OR status = 'publicado'
);

CREATE POLICY "Admins have full course control"
ON public.courses FOR ALL TO authenticated USING (public.get_member_type() = 'admin');
