import DataExportPanel from './DataExportPanel';
import DataImportPanel from './DataImportPanel';
import AccountDeletionModal from './AccountDeletionModal';

export default function DataManagement() {
    return (
        <div className="space-y-8 animate-fadeIn">
            <DataExportPanel />
            <DataImportPanel />
            <AccountDeletionModal />
        </div>
    );
}
