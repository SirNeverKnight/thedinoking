import * as PIXI from 'pixi.js';
import { GameTicker } from './ticker';

export function createPixiApp(canvasParent) {
  const app = new PIXI.Application({
    width: 1000,
    height: 500,
    backgroundColor: 0xF7F7F7,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });

  canvasParent.appendChild(app.view);

  // Layered Containers
  const groundContainer = new PIXI.Container();
  const obstacleContainer = new PIXI.Container();
  const playerContainer = new PIXI.Container();
  const uiContainer = new PIXI.Container();

  app.stage.addChild(groundContainer);
  app.stage.addChild(obstacleContainer);
  app.stage.addChild(playerContainer);
  app.stage.addChild(uiContainer);

  const gameTicker = new GameTicker(app, {
    ground: groundContainer,
    obstacles: obstacleContainer,
    players: playerContainer,
    ui: uiContainer,
  });

  return {
    app,
    gameTicker,
    destroy: () => {
      gameTicker.destroy();
      app.destroy(true, { children: true });
    },
  };
}
