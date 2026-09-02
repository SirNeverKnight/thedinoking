import * as PIXI from 'pixi.js';
import { lerp } from './utils/lerp';
import { PlayerSprite } from './sprites/PlayerSprite';
import { ObstacleSprite } from './sprites/ObstacleSprite';

export class GameTicker {
  constructor(app, stageContainers) {
    this.app = app;
    this.containers = stageContainers; // { ground, obstacles, players, ui }

    this.playerSprites = new Map();
    this.obstacleSprites = new Map();
    
    this.latestSnapshot = null;
    this.previousSnapshot = null;
    this.snapshotAlpha = 0;
    this.tickCount = 0;

    this.groundX = 0;
    this.createGround();
    this.createClouds();

    // Start 60 FPS Pixi Ticker
    this.app.ticker.add(this.update.bind(this));
  }

  createGround() {
    this.groundGraphics = new PIXI.Graphics();
    this.containers.ground.addChild(this.groundGraphics);
    this.drawGround(0);
  }

  drawGround(offsetX) {
    const g = this.groundGraphics;
    g.clear();
    
    // Main Ground Line at Y = 400
    g.lineStyle(3, 0x535353);
    g.moveTo(0, 400);
    g.lineTo(1200, 400);
    g.lineStyle(0);

    // Decorative Ground Bumps & Dots
    g.beginFill(0x888888);
    for (let i = -100; i < 1300; i += 60) {
      const px = (i - offsetX) % 1300;
      g.drawRect(px, 404, 8, 2);
      g.drawRect(px + 20, 408, 4, 2);
    }
    g.endFill();
  }

  createClouds() {
    this.clouds = [
      { x: 300, y: 120, speed: 0.5 },
      { x: 700, y: 80, speed: 0.7 },
      { x: 1000, y: 150, speed: 0.4 },
    ];
    this.cloudGraphics = new PIXI.Graphics();
    this.containers.ground.addChild(this.cloudGraphics);
  }

  updateClouds(dt) {
    const g = this.cloudGraphics;
    g.clear();
    g.beginFill(0xC4C4C4);
    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed;
      if (cloud.x < -100) cloud.x = 1100;

      // Draw simple cloud pixel shape
      g.drawRect(cloud.x, cloud.y, 40, 12);
      g.drawRect(cloud.x + 10, cloud.y - 8, 20, 8);
    }
    g.endFill();
  }

  onSnapshot(snapshot) {
    this.previousSnapshot = this.latestSnapshot;
    this.latestSnapshot = snapshot;
    this.snapshotAlpha = 0;
    this.tickCount = snapshot.t || this.tickCount + 1;
  }

  update(delta) {
    const dt = delta / 60.0;
    this.updateClouds(dt);

    if (!this.latestSnapshot) return;

    // Scroll ground with current world speed
    const worldSpeed = this.latestSnapshot.v || 300;
    this.groundX += (worldSpeed * dt);
    this.drawGround(this.groundX);

    // LERP Progress over 30 Hz tick interval (2 frames at 60 FPS)
    this.snapshotAlpha = Math.min(1.0, this.snapshotAlpha + (delta / 2.0));

    // Update Player Sprites
    const activePlayerIds = new Set();
    const playersData = this.latestSnapshot.p || [];

    for (const p of playersData) {
      const [slot, userId, username, posX, posY, isAlive, score, colorId] = p;
      activePlayerIds.add(userId);

      let sprite = this.playerSprites.get(userId);
      if (!sprite) {
        sprite = new PlayerSprite(userId, username, colorId);
        this.containers.players.addChild(sprite.container);
        this.playerSprites.set(userId, sprite);
      }

      // Smooth position LERP if previous snapshot exists
      let renderX = posX;
      let renderY = posY;

      if (this.previousSnapshot && this.previousSnapshot.p) {
        const prevPlayer = this.previousSnapshot.p.find(item => item[1] === userId);
        if (prevPlayer) {
          renderX = lerp(prevPlayer[3], posX, this.snapshotAlpha);
          renderY = lerp(prevPlayer[4], posY, this.snapshotAlpha);
        }
      }

      sprite.update(renderX, renderY, isAlive === 1, this.tickCount);
    }

    // Cleanup disconnected players
    for (const [uId, sprite] of this.playerSprites.entries()) {
      if (!activePlayerIds.has(uId)) {
        sprite.destroy();
        this.playerSprites.delete(uId);
      }
    }

    // Update Obstacle Sprites
    const activeObsIds = new Set();
    const obstaclesData = this.latestSnapshot.o || [];

    for (const obs of obstaclesData) {
      const [obsId, posX, posY, width, height] = obs;
      activeObsIds.add(obsId);

      let sprite = this.obstacleSprites.get(obsId);
      if (!sprite) {
        sprite = new ObstacleSprite(obsId, "CACTUS", width, height);
        this.containers.obstacles.addChild(sprite.container);
        this.obstacleSprites.set(obsId, sprite);
      }

      sprite.update(posX, posY, this.tickCount);
    }

    // Cleanup off-screen obstacles
    for (const [oId, sprite] of this.obstacleSprites.entries()) {
      if (!activeObsIds.has(oId)) {
        sprite.destroy();
        this.obstacleSprites.delete(oId);
      }
    }
  }

  destroy() {
    this.app.ticker.remove(this.update.bind(this));
    for (const sprite of this.playerSprites.values()) sprite.destroy();
    for (const sprite of this.obstacleSprites.values()) sprite.destroy();
    this.playerSprites.clear();
    this.obstacleSprites.clear();
  }
}
