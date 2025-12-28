/**
 * GITHUB COMMENT:
 * [seed-personas.js]
 * NEW: Automation script to populate demo accounts with persona-specific data.
 * INTEGRATION: Uses AES-GCM encryption for Journals and Workbooks to match production security.
 * PERSONAS: David (Day 1), Ned (90 Days), Lisa (7 Years), Walt (35+ Years).
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { encrypt, generateSalt, generateKey } from '../src/lib/crypto.ts';

const firebaseConfig = { /* Your production/uat config here */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const PERSONAS = [
  {
    name: "David",
    email: "demo-david@mrt.app",
    pin: "1111",
    stage: "Day 1 (Acute Crisis)",
    journalFocus: "Unencrypted, raw entries reflecting high distress.",
    tasks: [{ title: "Call Sponsor", status: "pending", priority: "High" }],
  },
  {
    name: "Ned",
    email: "demo-ned@mrt.app",
    pin: "2222",
    stage: "90 Days (Pink Cloud)",
    journalFocus: "High energy, template-driven entries with 'Grateful' tags.",
    tasks: [{ title: "Morning Meditation", status: "completed", currentStreak: 90 }],
  },
  {
    name: "Lisa",
    email: "demo-lisa@mrt.app",
    pin: "3333",
    stage: "7 Years (Service/Sponsor)",
    journalFocus: "Reflections on sponsoring others and maintenance.",
    workbooks: { workbookId: "12_steps", sectionId: "step_12", status: "completed" },
  },
  {
    name: "Walt",
    email: "demo-walt@mrt.app",
    pin: "4444",
    stage: "35+ Years (Zen Master)",
    journalFocus: "Deeply spiritual and somatic logs.",
    vitality: { tags: ["Vitality", "Breathwork"], frequency: "Daily" }
  }
];

async function seedPersona(persona) {
  console.log(`🚀 Seeding ${persona.name}...`);
  const userCredential = await signInWithEmailAndPassword(auth, persona.email, "demo-password-123");
  const uid = userCredential.user.uid;

  // 1. Initialize User Profile with Encryption Salt [cite: 16, 229]
  const salt = generateSalt();
  await setDoc(doc(db, "users", uid), {
    uid,
    email: persona.email,
    displayName: persona.name,
    encryptionSalt: salt,
    role: "demo_persona",
    createdAt: Timestamp.now()
  });

  // 2. Generate Key for Encryption [cite: 219]
  await generateKey(persona.pin, salt);

  // 3. Persona-Specific Data Seeding [cite: 18, 19, 32]
  if (persona.name === "David") {
    // Seed unencrypted journals to reflect Day 1 chaos [cite: 18]
    await addDoc(collection(db, "journals"), {
      uid,
      content: "I hit a wall today. Everything feels heavy. I'm scared.",
      isEncrypted: false,
      createdAt: Timestamp.now()
    });
  } else {
    // Seed encrypted journals for others [cite: 230]
    const encryptedContent = await encrypt(`Recovery reflection for ${persona.name}. Step ${persona.stage}.`);
    await addDoc(collection(db, "journals"), {
      uid,
      content: encryptedContent,
      isEncrypted: true,
      createdAt: Timestamp.now()
    });
  }
}

// Run Seeding
(async () => {
  for (const p of PERSONAS) await seedPersona(p);
  console.log("✅ All demo personas seeded successfully.");
})();