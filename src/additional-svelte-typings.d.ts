declare namespace svelteHTML {
	interface HTMLAttributes<T> {
		'on:spy'?: (event: CustomEvent<string>) => void;
	}
}
