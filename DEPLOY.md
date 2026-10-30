# Run & deploy Objection-to-Insight

## A. Run in VS Code (fastest)

1. Download and extract `Objection-to-Insight.zip`.
2. Open VS Code → **File → Open Folder** → select the extracted `Objection-to-Insight` folder.
3. Install the VS Code extension **Live Server** (Ritwick Dey), if it is not already installed.
4. Right-click `index.html` → **Open with Live Server**.

The app should open in your browser. There is no `npm install` or build command.

### Alternative: Python server

Open the VS Code terminal in the project folder and run:

```bash
python -m http.server 8000
```

Visit:

```text
http://localhost:8000
```

To stop the server, return to the terminal and press `Ctrl + C`.

## B. Publish on GitHub Pages

Create a **new empty public repository** on GitHub named `objection-to-insight`. Do not add a README or `.gitignore` on GitHub because those files are already in this folder.

Open the VS Code terminal in the extracted project folder and run these commands one at a time. Replace `YOUR-USERNAME` with your GitHub username.

```bash
git init
git add .
git commit -m "Initial Objection-to-Insight release"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/objection-to-insight.git
git push -u origin main
```

Then in the GitHub repository:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**.
4. Click **Save**.
5. Wait for the Pages deployment workflow to finish in the repository's **Actions** tab.

The published address will be:

```text
https://YOUR-USERNAME.github.io/objection-to-insight/
```

If you use a different repository name, replace `objection-to-insight` in the URL with that repository name.

## C. Push future updates

After editing and testing files, run:

```bash
git add .
git commit -m "Update Objection-to-Insight"
git push
```

GitHub Pages will publish the updated static files after the deployment completes.

## Notes

- Git must be installed and configured on your computer for the Git commands to work.
- If `git` is not recognised, install Git for your operating system, reopen VS Code and try again.
- This is a static site. Keep `index.html`, `styles.css`, `app.js` and the `assets` folder in the repository root/folder structure shown in the README.
- LocalStorage data remains in each visitor's browser and is not shared with you or other visitors.
