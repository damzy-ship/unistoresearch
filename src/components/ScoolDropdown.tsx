interface School {
  id: number;
  short_name: string;
}

interface SchoolDropdownProps {
  schools: School[];
  selectedSchoolId: string | null;
  onChange: (id: string) => void;
  disabled: boolean;
}

export default function SchoolDropdown({ schools, selectedSchoolId, onChange, disabled }: SchoolDropdownProps) {
  return (
    <div className="relative">
      <select
        value={selectedSchoolId || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
        disabled={disabled}
      >
        <option value="" disabled>Select your school</option>
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.short_name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}