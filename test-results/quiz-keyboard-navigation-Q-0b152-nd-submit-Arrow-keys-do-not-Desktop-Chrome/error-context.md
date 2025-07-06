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
  - form:
    - heading "Profile" [level=2]
    - img "User Avatar"
    - text: Guest Loading settings…
    - button "Sign in with Google": Sign In with Google
    - button "Reset all user data": Reset All
    - heading "Test/Dev Email Sign-In" [level=4]
    - textbox "Test email": testuserc-y7zh1rdp@gmail.com
    - textbox "Test password": testuserC
    - button "Sign in with email": Sign In (Test Only)
- contentinfo:
  - textbox "Search questions"
- paragraph: Running in emulator mode. Do not use with production credentials.
```