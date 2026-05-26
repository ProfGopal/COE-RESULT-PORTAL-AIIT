# Amity University Student Result Portal: Design System

This document outlines the foundational design principles, visual language, and component behaviors for the Student Result Portal. It serves as the single source of truth for maintaining a minimalist, lightweight, and cohesive institutional interface.

---

## 1. Design Principles

* **Institutional Authority:** The interface must project trust, accuracy, and official standing.
* **Absolute Minimalism:** Remove all non-essential visual noise. The data (grades, results) is the primary focus.
* **Clear Information Hierarchy:** Use contrast, spacing, and typography to guide the user’s eye sequentially through tasks.
* **Tactile Interactions:** Ensure interactive elements feel responsive through subtle, purposeful micro-animations rather than flashy transitions.

---

## 2. Color Palette

The color system relies heavily on whitespace and neutrals, utilizing brand colors strategically for navigation, primary actions, and interaction feedback.

### Brand Colors
* **Primary Brand (Amity Blue):** Deep Navy **#003366**. Used for primary headings, active button states, branded header blocks, and primary icons. Represents authority and focus.
* **Accent Brand (Amity Gold):** Vibrant Golden Yellow **#FFCA08**. Used exclusively for focus rings, hover borders, text selection backgrounds, and subtle active indicators. 

### Neutral Scale
* **Base Background:** Very Light Slate Gray **#F8FAFC**. Serves as the application canvas, keeping the interface soft on the eyes.
* **Component Background:** Pure White **#FFFFFF**. Used for structural cards, tables, and input fields to make them pop against the base background.
* **Borders & Dividers:** Light Slate **#E2E8F0**. Used for subtle structural separation.
* **Primary Text:** Very Dark Slate **#0F172A**. Used for body copy and data table contents.
* **Secondary Text:** Medium Slate **#64748B**. Used for helper text, subtitles, and disabled states.

### Semantic Colors
* **Success:** Muted Green. Used for passing grades or successful upload notifications.
* **Warning:** Amber. Used for destructive action warnings (e.g., clearing the database).
* **Error:** Soft Red. Used for failed logins, missing SEN numbers, or failing grades.

---

## 3. Typography

The portal relies on a single, clean sans-serif typeface to maintain high legibility across dense data tables and small device screens.

### Font Styles
* **Primary Headings:** Bold weight, tight letter spacing. Used for page titles and major section headers. Always rendered in Amity Blue.
* **Subheadings:** Semi-bold weight, standard letter spacing. Used for card titles and table headers.
* **Body Copy:** Regular weight, relaxed line height. Used for standard paragraph text and data rows.
* **Microcopy & Labels:** Small text size, medium weight, wide letter spacing, uppercase. Used for overlines, status tags, and form input labels. Rendered in Secondary Text color.

---

## 4. Spacing & Layout

The spatial system is built on a predictable, proportional grid to ensure rhythm and consistency.

### Structure
* **Max Width:** The core application content is constrained to a central, maximum-width column to prevent data from stretching uncomfortably on ultra-wide monitors.
* **Header:** Fixed top position, clearly separating the university branding and session status from the scrolling content area.
* **Containers:** Data is always grouped inside distinct visual containers (Cards) separated from the base background by subtle shadows.

### Density
* **Loose Density:** Used for landing pages, login screens, and dashboard overview metrics. Generous padding gives elements room to breathe.
* **Tight Density:** Used for the actual result data tables and semester accordions. Padding is reduced to allow maximum data visibility without endless scrolling.

---

## 5. UI Components

### Interactive Elements
* **Primary Buttons:** Solid Amity Blue background, white text, medium weight, slightly rounded corners.
* **Secondary Buttons:** Solid light gray background, Amity Blue text. Used for less critical actions like "Cancel" or "Go Back."
* **Destructive Buttons:** Ghost style (transparent background) with red text. Turns solid red only on hover.

### Forms & Inputs
* **Text Fields:** White background, light slate border. 
* **Focus State:** When an input is selected, the border transitions to Amity Gold, accompanied by a subtle outer glow (focus ring) in the same color. 
* **Labels:** Positioned directly above the input field, using Microcopy typography rules.

### Data Display
* **Structural Cards:** White background, thin slate border, subtle drop shadow. Corners are gently rounded.
* **Accordions (Semesters):** Clean horizontal rows with an expansion arrow on the far right. Expanding a row pushes the content down smoothly to reveal the nested data table.
* **Data Tables:** Clean, borderless rows. Only a thin horizontal divider separates row items. Column headers use uppercase Microcopy styling.

---

## 6. Micro-Interactions & Motion

Animation is strictly functional. It serves to confirm user actions or clarify spatial relationships.

* **Hover Lift:** Interactive cards (like the portal selection buttons) gently lift upward by a few pixels on mouse hover, accompanied by an increase in drop-shadow depth and a border color shift to Amity Gold.
* **Color Fades:** Button background colors and input borders transition smoothly over a fast duration (e.g., a fraction of a second) rather than snapping instantly.
* **Accordion Reveals:** Expanding a semester result card slides the content open smoothly rather than popping into existence abruptly.