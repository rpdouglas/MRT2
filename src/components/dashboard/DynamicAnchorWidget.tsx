import { useState } from "react";
import { useTimeOfDay, TIME_BASED_PROMPTS } from "../../hooks/useTimeOfDay";
import { useAnchorStatus } from "../../hooks/useAnchorStatus";
import {
  SunIcon,
  MoonIcon,
  BookOpenIcon,
  XMarkIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import JournalEditor from "../journal/JournalEditor";
import VaultGate from "../VaultGate";
import ReadingModal from "../readings/ReadingModal";
import { useEncryption } from "../../contexts/EncryptionContext";
import { FELLOWSHIPS } from "../../data/fellowships";
import { useAllDailyReadings } from "../../hooks/useDailyReading";
import { useReadingPreferences, ALL_MODALITIES } from "../../hooks/useReadingPreferences";
import { useUserProfile } from "../../hooks/useUserProfile";
import { format } from "date-fns";
import type { DailyReading } from "../../lib/db";

export default function DynamicAnchorWidget() {
  const timeOfDay = useTimeOfDay();
  const { needsCheckIn, needsReading } = useAnchorStatus();
  const { isVaultUnlocked } = useEncryption();

  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [journalOverrideContent, setJournalOverrideContent] = useState<string | null>(null);

  const { preferences, activeModality, hasReadToday, markAsRead } = useReadingPreferences();
  const selectedModalities = preferences?.selectedModalities ?? ALL_MODALITIES;
  const readingResults = useAllDailyReadings(selectedModalities);

  // Only readings that exist in Firestore
  const availableReadings = readingResults
    .map(r => r.data)
    .filter((r): r is DailyReading => r != null);

  // Start on today's active modality if it has a reading, otherwise index 0
  const initialReadingIndex = Math.max(
    0,
    availableReadings.findIndex(r => r.modality === activeModality)
  );

  const { profile: userProfile, patchFields } = useUserProfile();

  const recoveryPath =
    userProfile?.anchorSettings?.defaultFellowship ||
    (userProfile as unknown as { recoveryPath?: string })?.recoveryPath ||
    "DEFAULT";
  // FELLOWSHIPS has no 'DEFAULT' entry — recoveryPath falls back to the
  // literal string "DEFAULT" when unset, so that lookup must itself fall
  // back to a real entry (AA) or this throws for any user without
  // anchorSettings.defaultFellowship set (found via PROJ-59 test coverage).
  const fellowship = FELLOWSHIPS[recoveryPath] || FELLOWSHIPS.AA;

  const updateReadingDate = async () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    await patchFields.mutateAsync({ "anchorSettings.lastReadingDate": todayStr });
  };

  const handleReadingClick = async (url: string) => {
    window.open(url, "_blank");
    await updateReadingDate();
  };

  const handleInAppReadingClick = () => {
    if (availableReadings.length > 0) {
      setIsReadingModalOpen(true);
      const initial = availableReadings[initialReadingIndex];
      if (initial && !hasReadToday) markAsRead.mutate(initial.id);
    } else {
      handleReadingClick(fellowship.dailyReadingUrl);
    }
  };

  const handleJournalFromReading = (reading: DailyReading) => {
    setIsReadingModalOpen(false);
    setJournalOverrideContent(
      `Reading: "${reading.title}"\n\nReflection: ${reading.reflection}\n\nMy thoughts:\n`
    );
    setIsJournalModalOpen(true);
  };

  const handleCloseJournal = () => {
    setIsJournalModalOpen(false);
    setJournalOverrideContent(null);
  };

  const isDay = timeOfDay === "morning" || timeOfDay === "afternoon";
  const TimeIcon = isDay ? SunIcon : MoonIcon;
  const timeText = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
  const btnGradient = isDay
    ? "bg-gradient-to-br from-amber-400 to-orange-500"
    : "bg-gradient-to-br from-indigo-500 to-violet-600";

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Card 1 — Check-In */}
        <button
          onClick={() => setIsJournalModalOpen(true)}
          className={`relative flex flex-row items-center justify-start gap-2 rounded-full shadow-md py-2 px-4 min-w-0 hover:brightness-110 transition active:scale-95 ${btnGradient}`}
        >
          {needsCheckIn && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1 pointer-events-none">
              <ExclamationCircleIcon className="h-4 w-4 text-red-500 fill-white bg-white rounded-full" />
            </div>
          )}
          {!isVaultUnlocked && (
            <div className="absolute top-0 left-0 -mt-1 -ml-1 pointer-events-none">
              <LockClosedIcon className="h-3 w-3 text-white/70 bg-white/20 rounded-full" />
            </div>
          )}
          <TimeIcon className="h-5 w-5 shrink-0 text-white" />
          <span className="text-xs font-bold text-white truncate">
            {timeText} Check-In
          </span>
        </button>

        {/* Card 2 — Daily Reading */}
        <div className="relative flex">
          <Menu>
            <div className={`relative flex flex-row items-stretch justify-between w-full ${btnGradient} rounded-full shadow-md transition hover:brightness-110`}>
              {needsReading && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 z-10 pointer-events-none">
                  <ExclamationCircleIcon className="h-4 w-4 text-red-500 fill-white bg-white rounded-full" />
                </div>
              )}
              <button
                onClick={handleInAppReadingClick}
                className="flex flex-row items-center justify-start gap-2 py-2 px-4 flex-1 rounded-l-full active:scale-95 origin-left min-w-0"
              >
                <BookOpenIcon className="h-5 w-5 shrink-0 text-white" />
                <span className="text-xs font-bold text-white truncate">
                  Daily Reading
                </span>
              </button>
              <MenuButton className="flex items-center justify-center px-2 border-l border-white/30 rounded-r-full active:bg-white/20 transition-colors">
                <ChevronDownIcon className="h-3 w-3 text-white" />
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
      </div>

      {/* Reading Modal */}
      {isReadingModalOpen && availableReadings.length > 0 && (
        <ReadingModal
          readings={availableReadings}
          initialIndex={initialReadingIndex}
          onClose={() => setIsReadingModalOpen(false)}
          onJournal={handleJournalFromReading}
        />
      )}

      {/* Journal — fullscreen overlay matching the journal page layout */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-[60] bg-indigo-200 flex flex-col animate-slideUp">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
            <span className="text-sm font-bold text-indigo-900">
              {journalOverrideContent ? "Journal on Reading" : `${timeText} Check-In`}
            </span>
            <button
              onClick={handleCloseJournal}
              className="p-2 bg-white/40 hover:bg-white/60 text-indigo-900 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-20">
            <VaultGate>
              <JournalEditor
                initialEntry={null}
                initialContent={journalOverrideContent ?? TIME_BASED_PROMPTS[timeOfDay]}
                initialTags={journalOverrideContent ? ["Reading", "Daily Reading"] : ["Anchor", timeOfDay]}
                onSaveComplete={handleCloseJournal}
              />
            </VaultGate>
          </div>
        </div>
      )}
    </>
  );
}
