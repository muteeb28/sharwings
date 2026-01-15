import React from "react";

export const LoaderOne = () => {
	return (
		<div className="flex items-center justify-center gap-2" role="status" aria-live="polite">
			<span className="sr-only">Loading</span>
			<span
				className="h-3 w-3 rounded-full bg-emerald-400 animate-bounce"
				style={{ animationDelay: "-0.3s" }}
			/>
			<span
				className="h-3 w-3 rounded-full bg-emerald-400 animate-bounce"
				style={{ animationDelay: "-0.15s" }}
			/>
			<span className="h-3 w-3 rounded-full bg-emerald-400 animate-bounce" />
		</div>
	);
};
