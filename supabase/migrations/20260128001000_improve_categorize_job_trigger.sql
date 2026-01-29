-- ============================================================================
-- IMPROVED CATEGORIZE_JOB TRIGGER - FIX 93% UNCATEGORIZATION ISSUE
-- Purpose: Add title-based categorization + better fallbacks
-- Date: January 28, 2026
-- Impact: Should categorize ~90%+ of jobs with business career paths
-- ============================================================================

CREATE OR REPLACE FUNCTION public.categorize_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  job_title TEXT;
  job_description TEXT;
  job_company TEXT;
  job_categories TEXT[];
BEGIN
  -- Get job fields (normalized to lowercase)
  job_title := LOWER(COALESCE(NEW.title, ''));
  job_description := LOWER(COALESCE(NEW.description, ''));
  job_company := LOWER(COALESCE(NEW.company, ''));
  job_categories := COALESCE(NEW.categories, ARRAY[]::TEXT[]);

  -- ============================================================================
  -- STEP 1: Ensure 'early-career' category
  -- ============================================================================
  IF NOT ('early-career' = ANY(job_categories)) THEN
    IF job_title LIKE '%graduate%' OR job_title LIKE '%grad%' OR
       job_title LIKE '%intern%' OR job_title LIKE '%internship%' OR
       job_title LIKE '%entry level%' OR job_title LIKE '%entry-level%' OR
       job_title LIKE '%junior%' OR job_title LIKE '%trainee%' OR
       job_title LIKE '%associate%' OR job_title LIKE '%assistant%' OR
       job_title LIKE '%stage%' OR job_title LIKE '%praktikum%' OR
       job_title LIKE '%prácticas%' OR job_title LIKE '%tirocinio%' OR
       job_title LIKE '%becario%' OR job_title LIKE '%werkstudent%' OR
       job_title LIKE '%placement%' OR job_title LIKE '%summer%' OR
       job_title LIKE '%winter%' OR job_description LIKE '%graduate%' OR
       job_description LIKE '%internship%' OR job_description LIKE '%entry level%' OR
       NEW.is_graduate = true OR NEW.is_internship = true THEN
      job_categories := array_append(job_categories, 'early-career');
    END IF;
  END IF;

  -- ============================================================================
  -- STEP 1.5: IMPROVED - Title-based categorization (more reliable!)
  -- This runs BEFORE description-based, and is more likely to match
  -- ============================================================================
  IF NOT (job_categories && ARRAY['strategy-business-design', 'finance-investment', 'sales-client-success', 'marketing-growth', 'data-analytics', 'operations-supply-chain', 'product-innovation', 'tech-transformation', 'sustainability-esg']) THEN
    
    -- Strategy & Consulting by title
    IF job_title LIKE '%consultant%' OR job_title LIKE '%consulting%' OR
       job_title LIKE '%strategy%' OR job_title LIKE '%business analyst%' OR
       job_title LIKE '%management analyst%' OR job_title LIKE '%advisory%' THEN
      job_categories := array_append(job_categories, 'strategy-business-design');
    
    -- Finance by title
    ELSIF job_title LIKE '%financial%' OR job_title LIKE '%finance%' OR
          job_title LIKE '%accounting%' OR job_title LIKE '%audit%' OR
          job_title LIKE '%investment%' OR job_title LIKE '%banking%' THEN
      job_categories := array_append(job_categories, 'finance-investment');
    
    -- Sales by title
    ELSIF job_title LIKE '%sales%' OR job_title LIKE '%business development%' OR
          job_title LIKE '%bdr%' OR job_title LIKE '%sdr%' OR
          job_title LIKE '%account%' OR job_title LIKE '%customer success%' THEN
      job_categories := array_append(job_categories, 'sales-client-success');
    
    -- Data & Analytics by title
    ELSIF job_title LIKE '%data%' OR job_title LIKE '%analytics%' OR
          job_title LIKE '%analyst%' AND (job_description LIKE '%data%' OR job_description LIKE '%analytics%') OR
          job_title LIKE '%bi%' OR job_title LIKE '%business intelligence%' THEN
      job_categories := array_append(job_categories, 'data-analytics');
    
    -- Marketing by title
    ELSIF job_title LIKE '%marketing%' OR job_title LIKE '%brand%' OR
          job_title LIKE '%growth%' OR job_title LIKE '%digital%' THEN
      job_categories := array_append(job_categories, 'marketing-growth');
    
    -- Operations by title
    ELSIF job_title LIKE '%operations%' OR job_title LIKE '%supply chain%' OR
          job_title LIKE '%logistics%' OR job_title LIKE '%procurement%' OR
          job_title LIKE '%hr%' OR job_title LIKE '%human resources%' THEN
      job_categories := array_append(job_categories, 'operations-supply-chain');
    
    -- Product by title
    ELSIF job_title LIKE '%product%' OR job_title LIKE '%pm%' OR
          job_title LIKE '%ux%' OR job_title LIKE '%ui%' OR job_title LIKE '%designer%' THEN
      job_categories := array_append(job_categories, 'product-innovation');
    
    -- Tech by title
    ELSIF job_title LIKE '%engineer%' OR job_title LIKE '%developer%' OR
          job_title LIKE '%software%' OR job_title LIKE '%devops%' OR
          job_title LIKE '%coding%' OR job_title LIKE '%programming%' THEN
      job_categories := array_append(job_categories, 'tech-transformation');
    
    -- Sustainability by title
    ELSIF job_title LIKE '%sustainability%' OR job_title LIKE '%esg%' OR
          job_title LIKE '%environmental%' OR job_title LIKE '%climate%' THEN
      job_categories := array_append(job_categories, 'sustainability-esg');
    
    END IF;
  END IF;

  -- ============================================================================
  -- STEP 2: Description-based categorization (fallback if title didn't match)
  -- Only apply if no career path assigned yet
  -- ============================================================================
  IF NOT (job_categories && ARRAY['strategy-business-design', 'finance-investment', 'sales-client-success', 'marketing-growth', 'data-analytics', 'operations-supply-chain', 'product-innovation', 'tech-transformation', 'sustainability-esg']) THEN
    
    IF job_description LIKE '%strategy consulting%' OR
       job_description LIKE '%management consulting%' OR
       job_description LIKE '%business transformation%' OR
       job_description LIKE '%advisory%' OR
       job_description LIKE '%consulting%' OR
       job_description LIKE '%business analyst%' THEN
      job_categories := array_append(job_categories, 'strategy-business-design');
    
    ELSIF job_description LIKE '%investment banking%' OR
          job_description LIKE '%corporate finance%' OR
          job_description LIKE '%financial analyst%' OR
          job_description LIKE '%accounting%' OR
          job_description LIKE '%audit%' OR
          job_description LIKE '%trading%' THEN
      job_categories := array_append(job_categories, 'finance-investment');
    
    ELSIF job_description LIKE '%sales development%' OR
          job_description LIKE '%business development%' OR
          job_description LIKE '%customer success%' OR
          job_description LIKE '%account executive%' THEN
      job_categories := array_append(job_categories, 'sales-client-success');
    
    ELSIF job_description LIKE '%data analyst%' OR
          job_description LIKE '%data science%' OR
          job_description LIKE '%business intelligence%' OR
          job_description LIKE '%analytics%' THEN
      job_categories := array_append(job_categories, 'data-analytics');
    
    ELSIF job_description LIKE '%marketing%' AND (job_description LIKE '%intern%' OR job_description LIKE '%analyst%') OR
          job_description LIKE '%digital marketing%' OR
          job_description LIKE '%growth marketing%' THEN
      job_categories := array_append(job_categories, 'marketing-growth');
    
    ELSIF job_description LIKE '%operations%' AND (job_description LIKE '%analyst%' OR job_description LIKE '%intern%') OR
          job_description LIKE '%supply chain%' OR
          job_description LIKE '%logistics%' THEN
      job_categories := array_append(job_categories, 'operations-supply-chain');
    
    ELSIF job_description LIKE '%product management%' OR
          job_description LIKE '%product analyst%' OR
          job_description LIKE '%user experience%' THEN
      job_categories := array_append(job_categories, 'product-innovation');
    
    ELSIF job_description LIKE '%software engineer%' OR
          job_description LIKE '%software development%' OR
          job_description LIKE '%programming%' OR
          job_description LIKE '%devops%' THEN
      job_categories := array_append(job_categories, 'tech-transformation');
    
    ELSIF job_description LIKE '%sustainability%' OR
          job_description LIKE '%esg%' OR
          job_description LIKE '%environmental%' THEN
      job_categories := array_append(job_categories, 'sustainability-esg');
    
    END IF;
  END IF;

  -- ============================================================================
  -- STEP 3: CRITICAL NEW LOGIC - If still no business category, use smart fallback
  -- This prevents 93% of jobs being uncategorized!
  -- ============================================================================
  IF NOT (job_categories && ARRAY['strategy-business-design', 'finance-investment', 'sales-client-success', 'marketing-growth', 'data-analytics', 'operations-supply-chain', 'product-innovation', 'tech-transformation', 'sustainability-esg']) THEN
    
    -- If no description or description is too short, try harder with title patterns
    IF LENGTH(TRIM(job_description)) < 50 THEN
      
      -- Try to extract business category from any combination in title
      IF job_title LIKE '%analyst%' THEN
        -- Analyst is a strong signal for a business role
        job_categories := array_append(job_categories, 'strategy-business-design');
      
      ELSIF job_title LIKE '%coordinator%' OR job_title LIKE '%officer%' THEN
        -- Operations-like roles
        job_categories := array_append(job_categories, 'operations-supply-chain');
      
      ELSIF job_title LIKE '%specialist%' THEN
        -- Could be anything, default to strategy (safe guess)
        job_categories := array_append(job_categories, 'strategy-business-design');
      
      END IF;
    END IF;
  END IF;

  -- ============================================================================
  -- STEP 4: ALL EXISTING CATEGORIZATION LOGIC (preserved from original)
  -- (Keeping full existing logic - checking title patterns for each career path)
  -- ============================================================================
  
  -- Strategy & Business Design
  IF NOT ('strategy-business-design' = ANY(job_categories)) THEN
    IF job_title LIKE '%business analyst%' OR
       job_title LIKE '%associate consultant%' OR
       job_title LIKE '%junior consultant%' OR
       job_title LIKE '%strategy analyst%' OR
       job_title LIKE '%consulting intern%' OR
       job_title LIKE '%management consulting%' OR
       job_title LIKE '%transformation analyst%' OR
       job_title LIKE '%operations excellence%' OR
       job_title LIKE '%business strategy%' OR
       job_company LIKE '%consulting%' OR
       job_company LIKE '%deloitte%' OR
       job_company LIKE '%pwc%' OR
       job_company LIKE '%mckinsey%' OR
       job_company LIKE '%bain%' OR
       job_company LIKE '%bcg%' OR
       job_company LIKE '%accenture%' THEN
      job_categories := array_append(job_categories, 'strategy-business-design');
    END IF;
  END IF;

  -- Finance & Investment
  IF NOT ('finance-investment' = ANY(job_categories)) THEN
    IF job_title LIKE '%financial analyst%' OR
       job_title LIKE '%finance intern%' OR
       job_title LIKE '%investment banking analyst%' OR
       job_title LIKE '%risk analyst%' OR
       job_title LIKE '%audit associate%' OR
       job_title LIKE '%finance trainee%' OR
       job_title LIKE '%fp&a%' OR
       job_title LIKE '%credit analyst%' OR
       job_title LIKE '%corporate finance%' OR
       job_title LIKE '%treasury analyst%' THEN
      job_categories := array_append(job_categories, 'finance-investment');
    END IF;
  END IF;

  -- Sales & Client Success
  IF NOT ('sales-client-success' = ANY(job_categories)) THEN
    IF job_title LIKE '%sales representative%' OR
       job_title LIKE '%account executive%' OR
       job_title LIKE '%client success%' OR
       job_title LIKE '%customer success%' OR
       job_title LIKE '%account manager%' OR
       job_title LIKE '%sales development%' OR
       job_title LIKE '%revenue%' THEN
      job_categories := array_append(job_categories, 'sales-client-success');
    END IF;
  END IF;

  -- Data Analytics
  IF NOT ('data-analytics' = ANY(job_categories)) THEN
    IF job_title LIKE '%data analyst%' OR
       job_title LIKE '%business analyst%' OR
       job_title LIKE '%data scientist%' OR
       job_title LIKE '%analytics%' OR
       job_title LIKE '%bi analyst%' OR
       job_title LIKE '%data engineer%' THEN
      job_categories := array_append(job_categories, 'data-analytics');
    END IF;
  END IF;

  -- Marketing & Growth
  IF NOT ('marketing-growth' = ANY(job_categories)) THEN
    IF job_title LIKE '%marketing%' OR
       job_title LIKE '%brand%' OR
       job_title LIKE '%growth%' OR
       job_title LIKE '%digital marketing%' OR
       job_title LIKE '%content%' THEN
      job_categories := array_append(job_categories, 'marketing-growth');
    END IF;
  END IF;

  -- Operations & Supply Chain
  IF NOT ('operations-supply-chain' = ANY(job_categories)) THEN
    IF job_title LIKE '%operations%' OR
       job_title LIKE '%supply chain%' OR
       job_title LIKE '%logistics%' OR
       job_title LIKE '%procurement%' OR
       job_title LIKE '%hr%' OR
       job_title LIKE '%human resources%' OR
       job_title LIKE '%talent%' THEN
      job_categories := array_append(job_categories, 'operations-supply-chain');
    END IF;
  END IF;

  -- Product & Innovation
  IF NOT ('product-innovation' = ANY(job_categories)) THEN
    IF job_title LIKE '%product%' OR
       job_title LIKE '%pm%' OR
       job_title LIKE '%ux%' OR
       job_title LIKE '%ui%' OR
       job_title LIKE '%designer%' THEN
      job_categories := array_append(job_categories, 'product-innovation');
    END IF;
  END IF;

  -- Tech & Transformation
  IF NOT ('tech-transformation' = ANY(job_categories)) THEN
    IF job_title LIKE '%software engineer%' OR
       job_title LIKE '%developer%' OR
       job_title LIKE '%devops%' OR
       job_title LIKE '%coding%' OR
       job_title LIKE '%programming%' THEN
      job_categories := array_append(job_categories, 'tech-transformation');
    END IF;
  END IF;

  -- Sustainability & ESG
  IF NOT ('sustainability-esg' = ANY(job_categories)) THEN
    IF job_title LIKE '%sustainability%' OR
       job_title LIKE '%esg%' OR
       job_title LIKE '%environmental%' OR
       job_title LIKE '%climate%' THEN
      job_categories := array_append(job_categories, 'sustainability-esg');
    END IF;
  END IF;

  -- ============================================================================
  -- FINAL: Update categories and return
  -- ============================================================================
  NEW.categories := job_categories;
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;

