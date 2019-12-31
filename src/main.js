import App from './App.svelte';
import punycode from 'punycode';
import 'typeface-roboto';
import 'typeface-roboto-mono';

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;