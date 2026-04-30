import { useState } from "react";
import { useTimeOfDay, TIME_BASED_PROMPTS } from "../../hooks/useTimeOfDay";
import { useAnchorStatus } from "../../hooks/useAnchorStatus";
import {
  SunIcon,
  MoonIcon,
  BookOpenIcon,
  PlusCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import JournalEditor from "../journal/JournalEditor";
import VaultGate from "../VaultGate";
import { useEncryption } from "../../contexts/EncryptionContext";
import { FELLOWSHIPS } from "../../data/fellowships";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useTaskOperations } from "../../hooks/useTaskOperations";
import { endOfDay, format } from "date-fns";
import type { UserProfile } from "../../lib/db";

export default function DynamicAnchorWidget() {
  const timeOfDay = useTimeOfDay();
  const { needsCheckIn, needsReading, needsIntent } = useAnchorStatus();
  const { user } = useAuth();
  const { addTask } = useTaskOperations();
  const queryClient = useQueryClient();
  const { isVaultUnlocked } = useEncryption();

  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isIntentInputMode, setIsIntentInputMode] = useState(false);
  const [intentText, setIntentText] = useState("");

  const { data: userProfile } = useQuery<UserProfile | null>({
    queryKey: ["profile", user?.uid],
    queryFn: async () => {
      if (!user || !db) return null;
      const snap = await getDoc(doc(db, "users", user.uid));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    },
    enabled: !!user,
  });

  const recoveryPath =
    userProfile?.anchorSettings?.defaultFellowship ||
    (userProfile as unknown as { recoveryPath?: string })?.recoveryPath ||
    "DEFAULT";
  // Fallback if not found
  const fellowship = FELLOWSHIPS[recoveryPath] || FELLOWSHIPS.DEFAULT;

  const updateReadingDate = async () => {
    if (user && db) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      await updateDoc(doc(db, "users", user.uid), {
        "anchorSettings.lastReadingDate": todayStr,
      });
      queryClient.invalidateQueries({ queryKey: ["profile", user.uid] });
    }
  };

  const handleCard1Click = () => {
    setIsJournalModalOpen(true);
  };

  const handleReadingClick = async (url: string) => {
    window.open(url, "_blank");
    await updateReadingDate();
  };

  const handleCard3Click = () => {
    setIsIntentInputMode(true);
  };

  const submitIntent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!intentText.trim()) {
      setIsIntentInputMode(false);
      return;
    }

    await addTask({
      title: intentText,
      recurrence: { type: "once" },
      priority: "High",
      dueDate: endOfDay(new Date()),
      source: "anchor_intent",
    });

    setIntentText("");
    setIsIntentInputMode(false);
  };

  const handleIntentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submitIntent();
    } else if (e.key === "Escape") {
      setIsIntentInputMode(false);
      setIntentText("");
    }
  };

  const isDay = timeOfDay === "morning" || timeOfDay === "afternoon";
  const TimeIcon = isDay ? SunIcon : MoonIcon;
  const timeText = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Card 1 */}
        <button
          onClick={handleCard1Click}
          className="relative flex flex-row items-center justify-center gap-1 sm:gap-2 bg-white rounded-full shadow-sm border border-gray-100 py-2 px-1 min-w-0 hover:bg-gray-50 transition active:scale-95"
        >
          {needsCheckIn && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1 pointer-events-none">
              <ExclamationCircleIcon className="h-4 w-4 text-red-500 fill-white bg-white rounded-full" />
            </div>
          )}
          {!isVaultUnlocked && (
            <div className="absolute top-0 left-0 -mt-1 -ml-1 pointer-events-none">
              <LockClosedIcon className="h-3 w-3 text-slate-400 bg-white rounded-full" />
            </div>
          )}
          <TimeIcon
            className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${isDay ? "text-amber-500" : "text-indigo-500"}`}
          />
          <div className="flex flex-col items-start leading-tight text-left overflow-hidden">
            <span className="text-[10px] sm:text-xs font-bold text-gray-700 truncate w-full">
              {timeText}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-700 truncate w-full">
              Check-In
            </span>
          </div>
        </button>

        {/* Card 2 */}
        <div className="relative flex">
          <Menu>
            <div className="relative flex flex-row items-stretch justify-between w-full bg-white rounded-full shadow-sm border border-gray-100 transition hover:bg-gray-50">
              {needsReading && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 z-10 pointer-events-none">
                  <ExclamationCircleIcon className="h-4 w-4 text-red-500 fill-white" />
                </div>
              )}
              <button
                onClick={() => handleReadingClick(fellowship.dailyReadingUrl)}
                className="flex flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-2 flex-1 rounded-l-full active:scale-95 origin-left min-w-0"
              >
                <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-500" />
                <div className="flex flex-col items-start leading-tight text-left overflow-hidden">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-700 truncate w-full">
                    Daily
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-700 truncate w-full">
                    Reading
                  </span>
                </div>
              </button>
              <MenuButton className="flex items-center justify-center px-2 border-l border-gray-100 rounded-r-full active:bg-gray-100 transition-colors">
                <ChevronDownIcon className="h-3 w-3 text-gray-400" />
              </MenuButton>
            </div>

            <MenuItems
              transition
              className="absolute top-full left-0 mt-1 w-48 bg-white shadow-xl rounded-xl border border-gray-100 p-1 z-50 origin-top-right transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              {Object.values(FELLOWSHIPS).map((f) => (
                <MenuItem key={f.id}>
                  <button
                    onClick={() => handleReadingClick(f.dailyReadingUrl)}
                    className="group flex w-full items-center gap-2 rounded-lg py-2 px-3 data-[focus]:bg-emerald-50"
                  >
                    <BookOpenIcon className="h-4 w-4 text-emerald-500 opacity-50 group-data-[focus]:opacity-100" />
                    <span className="text-xs font-bold text-gray-700">
                      {f.name}
                    </span>
                  </button>
                </MenuItem>
              ))}
            </MenuItems>
          </Menu>
        </div>

        {/* Card 3 */}
        {isIntentInputMode ? (
          <div className="relative flex flex-row items-center justify-center bg-white rounded-full shadow-sm border border-blue-500 px-2 h-full">
            <input
              type="text"
              autoFocus
              value={intentText}
              onChange={(e) => setIntentText(e.target.value)}
              onKeyDown={handleIntentKeyDown}
              onBlur={() => submitIntent()}
              placeholder="Intent..."
              className="w-full text-xs font-bold text-gray-700 bg-transparent border-none focus:ring-0 p-0 placeholder-gray-300"
            />
          </div>
        ) : (
          <button
            onClick={handleCard3Click}
            className="relative flex flex-row items-center justify-center gap-1 sm:gap-2 bg-white rounded-full shadow-sm border border-gray-100 py-2 px-1 min-w-0 hover:bg-gray-50 transition active:scale-95"
          >
            {needsIntent && (
              <div className="absolute top-0 right-0 -mt-1 -mr-1 pointer-events-none">
                <ExclamationCircleIcon className="h-4 w-4 text-red-500 fill-white bg-white rounded-full" />
              </div>
            )}
            <PlusCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-blue-500" />
            <div className="flex flex-col items-start leading-tight text-left overflow-hidden">
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 truncate w-full">
                Set
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 truncate w-full">
                Intent
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Journal Modal */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative animate-slideUp">
            <button
              onClick={() => setIsJournalModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="pt-12 px-2 pb-2 h-[80vh] overflow-y-auto">
              <VaultGate>
                <JournalEditor
                  initialEntry={null}
                  initialContent={TIME_BASED_PROMPTS[timeOfDay]}
                  initialTags={["Anchor", timeOfDay]}
                  onSaveComplete={() => setIsJournalModalOpen(false)}
                />
              </VaultGate>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
