# Page snapshot

```yaml
- banner:
  - img "App Icon"
  - text: Massage Therapy Smart Study PRO
- navigation "Main navigation":
  - list:
    - listitem:
      - link "Go to Quiz page":
        - /url: /quiz
        - text: Quiz
    - listitem:
      - link "Go to Achievements page":
        - /url: /achievements
        - text: Achievements
    - listitem:
      - link "Go to Analytics page":
        - /url: /analytics
        - text: Analytics
    - listitem:
      - link "Go to Profile page":
        - /url: /profile
        - text: Profile
- main:
  - heading "Achievements" [level=2]
  - 'button "Open badge modal for badge: Broken Badge"':
    - img "Broken Badge"
    - text: Broken Badge
  - button "Close Modal": ×
  - img "Broken Badge"
  - heading "Broken Badge" [level=2]
  - paragraph: This badge image does not exist
  - strong: "Criteria:"
  - text: nonexistent_badge Earned!
  - button "Close badge modal": Close
- contentinfo:
  - textbox "Search questions"
```