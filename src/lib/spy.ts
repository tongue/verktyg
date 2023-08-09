import { derived, writable } from 'svelte/store';

type SpyElementDetails = {
	position: number;
	ratio: number;
};

type SpyOptions = {
	/** Selector to match the elements to spy on.
	 * @default 'section[id]' */
	selector?: string;
	/** Margin around the root element.
	 * @default '0px 0px 0px 0px' */
	rootMargin?: string;
};

const DEFAULT_OPTIONS = {
	selector: 'section[id]',
	rootMargin: '0px 0px 0px 0px'
} as const;

const THRESHOLD = Array(101)
	.fill(0)
	.map((_, i) => i / 100);

/**
 * Svelte Action that keeps track of the element that is most visible in the container element.
 *
 * @example <caption>Basic usage</caption>
 * ```html
 * <article use:spy on:spy="{(id) => { console.log(id) }}">
 * ```
 *
 * @param node The container element that contains the elements to spy on.
 * @param optionsa Options to configure the spy.
 **/
export function spy(node: HTMLElement, options?: SpyOptions) {
	let opts = { ...DEFAULT_OPTIONS, ...options };

	const elements = writable(new Map<Element, SpyElementDetails>());
	const sorted_elements = derived(elements, (e) =>
		[...e.entries()].sort(by_ratio_then_position).map(([el]) => el)
	);
	const active_element_id = derived(sorted_elements, (sorted_els) => sorted_els[0].id);
	const unsubscribe = active_element_id.subscribe(on_change);

	const io = new IntersectionObserver(on_intersection, {
		threshold: THRESHOLD,
		rootMargin: opts.rootMargin
	});
	const mo = new MutationObserver(on_mutation);

	function on_change(id: string) {
		node.dispatchEvent(new CustomEvent('spy', { detail: id }));
	}

	function on_intersection(entries: IntersectionObserverEntry[]) {
		for (const entry of entries) {
			update_element_ratio(entry.target, entry.intersectionRatio);
		}
	}

	function on_mutation(mutations: MutationRecord[]) {
		const needs_to_be_reconfigured = mutations.some((mutation) =>
			[...mutation.addedNodes, ...mutation.removedNodes].some(
				(element) => element instanceof HTMLElement && element.matches(opts.selector)
			)
		);
		if (needs_to_be_reconfigured) {
			teardown();
			configure();
		}
	}

	function update_element_ratio(element: Element, ratio: number) {
		elements.update(($values) => {
			const element_values = $values.get(element);
			if (element_values) {
				element_values.ratio = ratio;
			}
			return $values;
		});
	}

	function configure() {
		const els = node.querySelectorAll(opts.selector);
		for (const element of els) {
			if (element instanceof HTMLElement && element.id) {
				io.observe(element);
			}
		}
		elements.set(new Map([...els].map((element) => [element, { position: 0, ratio: 0 }])));
	}

	function teardown() {
		io.disconnect();
		elements.update(($values) => {
			$values.clear();
			return $values;
		});
	}

	configure();
	mo.observe(node, { subtree: true, childList: true });

	return {
		update(options: SpyOptions) {
			opts = { ...DEFAULT_OPTIONS, ...options };
			teardown();
			configure();
		},
		destroy() {
			mo.disconnect();
			unsubscribe();
			teardown();
		}
	};
}

function by_ratio_then_position(a: [Element, SpyElementDetails], b: [Element, SpyElementDetails]) {
	return b[1].ratio - a[1].ratio || a[1].position - b[1].position;
}
