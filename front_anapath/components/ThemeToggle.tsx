'use client';

/* cspell:ignore système Thème d'affichage */
import { ThemeMode, useTheme } from './ThemeProvider';

const OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
	{ value: 'light', label: 'Mode claire', icon: 'light_mode' },
	{ value: 'dark', label: 'Mode sombre', icon: 'dark_mode' },
	{ value: 'system', label: 'Mode système', icon: 'devices' },
];

export default function ThemeToggle({ vertical }: { vertical?: boolean } = {}) {
	const { theme, setTheme } = useTheme();

	const containerClass = vertical
		? 'flex flex-col items-start gap-2 p-2'
		: 'flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 p-0.5';

	return (
		<div className={containerClass} role="group" aria-label="Thème d'affichage">
			{OPTIONS.map((option) => {
				const active = theme === option.value;
				const itemClass = vertical
					? `w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
							active
								? 'bg-white dark:bg-[#252b36] text-primary dark:text-blue-300 shadow-sm'
								: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
						}`
					: `flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all ${
							active
								? 'bg-white dark:bg-[#252b36] text-primary dark:text-blue-300 shadow-sm'
								: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
						}`;

				return (
					<label key={option.value} className={itemClass}>
						<input
							type="radio"
							name="theme-mode"
							className="sr-only"
							checked={active}
							onChange={() => setTheme(option.value)}
						/>
						<span className="material-symbols-outlined text-base leading-none">{option.icon}</span>
						<span className="ml-2">{option.label}</span>
					</label>
				);
			})}
		</div>
	);
}
