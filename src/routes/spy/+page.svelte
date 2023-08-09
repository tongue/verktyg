<script lang="ts">
	import { spy } from '$lib/spy';

	let active = '';
	let sections = new Array(11).fill(0).map((_, i) => i + 1);
	let active_slide = sections.reduce<Record<number, number>>((acc, section) => {
		if (section % 2 && section > 1) {
			acc[section] = 0;
		}
		return acc;
	}, {});

	function on_spy(event: CustomEvent<string>) {
		active = event.detail;
	}

	function on_slide_spy(section: number) {
		return (event: CustomEvent<string>) => {
			const numbers = event.detail.split('-').map(Number).reverse();
			active_slide = { ...active_slide, [section]: numbers[0] };
		};
	}

	function on_add_section() {
		sections = [...sections, sections.length + 1];
	}
</script>

<h1>Spy</h1>
<article on:spy={on_spy} use:spy>
	{#each sections as section}
		<section id="section-{section}">
			<h2>Section {section}</h2>
			{#if section % 2 && section > 1}
				<ul on:spy={on_slide_spy(section)} use:spy={{ selector: 'li' }}>
					{#each Array(section).fill(0) as _, i}
						<li id="section-{section}-slide-{i}">Slide {i + 1}</li>
					{/each}
				</ul>
				{#if typeof active_slide[section] !== 'undefined'}
					<h3>Slide {active_slide[section] + 1} of {section}</h3>
				{/if}
			{/if}
		</section>
	{/each}
</article>
<menu>
	{#each sections as section}
		{@const id = `section-${section}`}
		<li aria-current={active === id ? 'location' : undefined}>
			<a href="#{id}">Section {section} </a>
		</li>
	{/each}

	<button on:click={on_add_section}>Add section</button>
</menu>

<style>
	:global(*) {
		scroll-behavior: smooth;
		font-family: -apple-system, system-ui, sans-serif;
	}
	h1 {
		font-size: 4em;
	}
	article {
		margin-bottom: 50vh;
	}
	section {
		scroll-margin-top: 1em;
		background: lightblue;
		height: 70vh;
		padding: 1em;
	}
	section:nth-child(2n) {
		background: goldenrod;
		height: 120vh;
	}
	section:nth-child(3n) {
		background: tomato;
		height: 30vh;
	}
	h2 {
		font-size: 3em;
		margin: 0;
	}
	menu {
		position: fixed;
		top: 1em;
		right: 1em;
		background: black;
		padding: 1em;
	}
	menu a {
		color: white;
		text-decoration: none;
	}
	menu [aria-current='location'] a {
		color: gold;
	}
	ul {
		display: flex;
		flex-wrap: nowrap;
		list-style: none;
		overflow: auto;
		padding: 0;
		margin: 0;
		height: 5em;
		scroll-snap-type: x mandatory;
		margin-top: 1em;
	}
	ul li {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		background-color: hotpink;
		color: gold;
		flex-shrink: 0;
		font-weight: bold;
		font-size: 2em;
		scroll-snap-stop: always;
		scroll-snap-align: center;
	}
</style>
