# ☁️ Data Export & Cloud Sync

You own your recovery data. MRT provides multiple ways to ensure you never lose it, even if you lose your phone, or completely remove it if you wish to leave.

<figure class="my-8 text-center">
  <img 
    src="/screenshots/ned-profile-general.webp" 
    alt="My Profile - General Settings" 
    class="rounded-3xl border-4 border-slate-900 shadow-xl max-w-[280px] sm:max-w-[320px] mx-auto block mb-3"
  />
  <figcaption class="text-xs text-slate-500 font-medium max-w-sm mx-auto">
    <strong>My Profile Settings:</strong> Ned's Amber Theme showing profile customization, sponsor contact info, and substance cost configurations.
  </figcaption>
</figure>

## 1. Google Drive Auto-Sync
If you created your account using **Google Sign-In**, MRT can automatically back up your data.
* Ensure your Vault is unlocked.
* Navigate to the **Profile -> Data** tab to verify your sync status.
* Every 7 days, the app will silently compile a JSON backup of your data and save it to your personal Google Drive in the background.
* *Note: This backup is unencrypted so you can always read it outside the app even if you lose your PIN.*

## 2. Manual Export
You can manually export your data at any time from the **Profile -> Data** tab.
* **JSON Backup:** A raw data file containing your entire history, including your Recovery Games activity.
* **PDF Document:** A beautifully formatted, readable document containing your Journals, Tasks, and Recovery Games history. Perfect for printing and bringing to a therapy session.

## 3. Import Backup
If you have a JSON backup file (from Manual Export or Google Drive Auto-Sync above), you can upload it in the **Data** tab to restore it. Journals, tasks, workbook answers, and Recovery Games history are all restored — this adds entries to your history rather than replacing it. Workbook answers restore cleanly onto the matching question if you import the same file twice, but journals, tasks, and game history don't check for duplicates, so re-importing the same backup a second time will add a second copy of each.

## 4. Account Deletion (The Right to be Forgotten)
If you wish to permanently destroy your account and wipe all data from our servers, you can do so directly from the app.
1. Navigate to **Profile -> Data**.
2. Scroll down to the red **Danger Zone** and click **Request Account Deletion**.
3. To protect against unauthorized deletion, the app will ask you to **verify your password** or **re-verify with Google**.
4. Once verified, the app will cryptographically shred all of your journals, tasks, and settings before permanently deleting your account. **This action cannot be undone.**

**Don't have the app open, or don't want to install it?** You can also request deletion from any browser at **myrecoverytoolkit.ca/delete-account** — sign in with your email/password or Google account, confirm, and the same cryptographic shredding runs immediately. No need to open the app first.
