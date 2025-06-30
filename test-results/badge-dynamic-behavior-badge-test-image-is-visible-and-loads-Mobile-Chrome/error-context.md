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
  - 'button "Open badge modal for badge: First Quiz"':
    - img "First Quiz"
    - text: First Quiz
  - 'button "Open badge modal for badge: Accuracy 100%"':
    - img "Accuracy 100%"
    - text: Accuracy 100%
  - 'button "Open badge modal for badge: Test Badge"':
    - img "Test Badge"
    - text: Test Badge
- contentinfo:
  - textbox "Search questions"
```