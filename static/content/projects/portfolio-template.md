---
title:
  text: "Portfolio Template"
  config: "3.5c 2.5c"
description: "My first Django project—a fully-functional portfolio website built to learn Django from the ground up. Features dynamic content management through Django's admin panel, integrated blog system, and email contact functionality."
date: "March 24, 2025"
published: true
featured: false
tags: ["django", "python", "html", "css", "smtp", "postgresql", "template", "portfolio"]
draft: false
image:
  url: "/images/projects/portfolio.png"
  alt: "Portfolio template homepage"
links:
  - text: "Live Demo"
    url: "https://abroor.pythonanywhere.com"
    icon: "external"
  - text: "GitHub"
    url: "https://github.com/uint82/portfolio"
    icon: "github"
---

# Overview

My first Django project—a portfolio website that taught me how web frameworks actually work. Built from scratch to learn Django's fundamentals: models, views, templates, forms, and that incredibly powerful admin panel.

What started as "I need a portfolio site" became "let me learn Django properly by building one." The result is a fully-functional website with dynamic content management, a blog system, and email integration. It's live at <a href="https://abroor.pythonanywhere.com" target="_blank">abroor.pythonanywhere.com</a>.

## Motivation

I needed a portfolio site to showcase my projects, but I also wanted to learn Django. Two birds, one stone.

I'd worked with Flask before, but Django's "batteries included" approach intrigued me. Everyone talked about how productive Django was for building web apps quickly. I wanted to see if the hype was real.

Instead of following tutorials that build todo lists or simple blogs, I decided to build something I'd actually use—a portfolio site with all the features I needed. If I was going to learn Django, I might as well end up with a portfolio at the end of it.

## Features

### Dynamic Content Management

**About Me Section** - Introduce yourself with a bio, profile picture, and social links. Update your story anytime through the admin panel.

**Timeline Events** - Showcase your journey with an interactive timeline. Add education milestones, career highlights, or personal achievements with dates and descriptions.

**Work Experience** - Display your professional history with company names, positions, dates, and detailed descriptions of your roles and accomplishments.

**Tech Stack** - Highlight your skills and technologies. Organize them by categories (languages, frameworks, tools) with custom icons and proficiency levels.

**Project Showcase** - Present your work with rich project cards. Include descriptions, images, links to live demos and GitHub repos. Mark projects as featured to highlight your best work.

### Blog System

**Write and Publish** - Built-in blog with full WYSIWYG editor support. Write posts in the admin panel, save as drafts, and publish when ready.

**SEO-Friendly** - Clean URLs, meta descriptions, and proper heading structure for better search engine visibility.

### Contact Integration

**Email Contact Form** - Let visitors reach you directly through your site. Built with SMTP integration to send messages straight to your inbox.

**Spam Protection** - Basic validation and rate limiting to keep spam at bay.

### Admin Panel Control

Everything is managed through Django's powerful admin interface:

- No code changes required for content updates
- Intuitive forms for all content types
- Rich text editors for long-form content
- Media upload handling for images
- User-friendly interface even for non-developers

## Technical Stack

### Backend

- **Django** - Robust Python web framework powering the entire site
- **SQLite** - Database for storing all content
- **Django Admin** - Built-in admin panel for content management
- **SMTP** - Email protocol integration for contact form functionality

### Frontend

- **HTML5** - Semantic markup for better accessibility and SEO
- **CSS3** - Custom styling with responsive design principles
- **Vanilla JavaScript** - Lightweight interactivity without framework overhead

### Deployment

- **PythonAnywhere** - Easy Python hosting with free tier available
- **Compatible with Heroku, Railway, DigitalOcean** - Deploy anywhere Django is supported

## Getting Started

### Prerequisites

- Python 3.8+
- pip
- virtualenv (recommended)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/uint82/portfolio.git
cd portfolio
```

**2. Create and activate a virtual environment**

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

**3. Install dependencies**

```bash
pip install -r requirements.txt
```

**4. Set up the database**

```bash
python manage.py migrate
```

**5. Create a superuser (admin)**

```bash
python manage.py createsuperuser
```

**6. Run the development server**

```bash
python manage.py runserver
```

**7. Access your site**

- Frontend: `http://127.0.0.1:8000/`
- Admin panel: `http://127.0.0.1:8000/admin`

Log in with your superuser credentials and start adding content!

## Configuration

### SMTP Setup

To enable the contact form, configure your SMTP settings in `settings.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Your SMTP server
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
```

For Gmail, you'll need to generate an app-specific password for security.

### Database Migration (Production)

For production, switch from SQLite to PostgreSQL:

1. Install PostgreSQL and psycopg2
2. Update `DATABASES` in `settings.py`
3. Run migrations: `python manage.py migrate`

## Technical Decisions

### Why Django?

I wanted to learn a full-featured web framework, and Django checked all the boxes. Coming from Flask, I was curious about Django's opinionated approach—how it forces you to structure projects in a certain way.

The admin panel was the selling point. Building a custom CMS from scratch would take weeks. Django gives you one out of the box. For a learning project, that meant I could focus on understanding Django's patterns rather than reinventing basic CRUD operations.

### Learning the ORM

Django's ORM was my first deep dive into object-relational mapping. Defining models and letting Django handle the database layer felt like magic at first.

Creating relationships between models—ForeignKeys for projects, ManyToManyFields for tags—taught me how relational databases actually work beyond raw SQL queries.

Migrations were confusing initially (why can't I just change the model?), but understanding them forced me to think about schema changes properly.

### Templates and Views

Django's MTV (Model-Template-View) pattern took some getting used to. Coming from Flask's more flexible routing, Django's structured approach felt restrictive at first.

But that structure is the point. It enforces separation of concerns. Business logic in views, presentation in templates, data in models. Once I understood the pattern, building new features became formulaic in a good way.

### Forms and Validation

The contact form taught me Django's form system. Server-side validation, CSRF protection, error handling—all built-in. No need to manually sanitize inputs or worry about basic security vulnerabilities.

Coming from writing raw HTML forms, Django's form rendering and validation felt like a productivity superpower.

### The Admin Panel

Customizing the admin panel was eye-opening. A few decorators and configurations in `admin.py` transformed the default interface into something that actually looks professional.

List displays, search fields, filters, inline editing—Django's admin is a complete CMS framework hiding in plain sight.

## What I Learned

**Django's structure is opinionated for a reason.** At first, the rigid project layout and naming conventions felt unnecessarily restrictive. But as the project grew, that structure kept everything organized. I always knew where to find things.

**The ORM is powerful but has a learning curve.** Writing queries with Django's ORM syntax took adjustment. `Project.objects.filter(featured=True).order_by('-date')` instead of raw SQL. But once it clicked, I stopped thinking about database queries and just worked with Python objects.

**Migrations are crucial.** I learned this the hard way after making model changes without creating migrations. Django's migration system isn't just a convenience—it's how you manage database schema changes properly in production.

**The admin panel is a framework within a framework.** You can build complete admin interfaces with just a few lines in `admin.py`. ModelAdmin classes, inlines, custom actions—there's a whole ecosystem of customization I barely scratched the surface of.

**Templates and template inheritance save time.** Creating a base template and extending it for each page eliminated so much repetitive HTML. Django's template language is limited compared to Jinja2, but that's intentional—it keeps logic out of templates.

**Forms handle so much more than just HTML.** Django forms do validation, cleaning, error handling, and rendering. I went from writing validation logic manually to letting Django handle it declaratively.

**Deployment is different from development.** Getting it live on PythonAnywhere taught me about static file serving, environment variables, database configuration differences, and WSGI servers. Development with `python manage.py runserver` is easy—production requires understanding the full stack.

**Security is built-in by default.** CSRF tokens, SQL injection protection, XSS prevention—Django handles these automatically if you follow its patterns. Coming from writing raw PHP or Node.js, having security as a default is refreshing.

This project took Django from "I've heard of it" to "I can build real applications with it." More importantly, it gave me a mental model for how web frameworks work—patterns I've applied to learning other frameworks since.


## Try It

Visit [abroor.pythonanywhere.com](https://abroor.pythonanywhere.com) to see the live site. It's my actual portfolio—real projects, real blog posts, real about section.

The [GitHub repo](https://github.com/uint82/portofolio) is public if you want to see how it's built or use it as a starting point for your own Django learning journey.

**This was my first Django project, and it taught me that the best way to learn a framework is to build something real with it.** Not a tutorial project, not a toy app—something you'll actually use and maintain.

If you're learning Django, build your portfolio with it. You'll end up with both a portfolio and Django skills. Two birds, one stone.
