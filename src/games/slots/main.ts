import '@shared/theme';
import '@shared/dev-frame';
import { createGame } from '@shared/game';
import { createLoop } from '@shared/loop';
import { createText } from '@actors/text';

// Slots entry — fills #app with a centered "Hello World".

const container = document.getElementById('app');
if (!container) throw new Error('#app not found');

const game = await createGame(container);

const hello = createText({ text: 'Hello World' });
game.app.stage.addChild(hello);

// Re-center on every resize; runs once on start too.
createLoop(game, {
  layout: (width, height) => hello.position.set(width / 2, height / 2),
});
