export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-800 border-t-emerald-500 animate-spin"></div>
            </div>
        </div>
    );
}
