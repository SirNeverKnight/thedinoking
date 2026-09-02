import * as PIXI from 'pixi.js';

export class ObstacleSprite {
  constructor(id, type, width, height) {
    this.id = id;
    this.type = type;
    this.width = width;
    this.height = height;

    this.container = new PIXI.Container();
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);

    this.renderObstacle();
  }

  update(x, y, tickCount) {
    this.container.position.set(x, y);
    if (this.type.startsWith('PTERODACTYL')) {
      const wingFrame = Math.floor(tickCount / 5) % 2;
      this.renderPterodactyl(wingFrame);
    }
  }

  renderObstacle() {
    if (this.type.startsWith('PTERODACTYL')) {
      this.renderPterodactyl(0);
    } else {
      this.renderCactus();
    }
  }

  renderCactus() {
    const g = this.graphics;
    g.clear();
    g.beginFill(0x535353); // Chrome dino cactus dark grey

    const w = this.width;
    const h = this.height;

    // Main Trunk
    g.drawRect(w * 0.35, 0, w * 0.3, h);

    // Left Arm
    g.drawRect(0, h * 0.3, w * 0.35, h * 0.15);
    g.drawRect(0, h * 0.15, w * 0.15, h * 0.2);

    // Right Arm
    g.drawRect(w * 0.65, h * 0.4, w * 0.35, h * 0.15);
    g.drawRect(w * 0.85, h * 0.25, w * 0.15, h * 0.2);

    g.endFill();
  }

  renderPterodactyl(wingFrame) {
    const g = this.graphics;
    g.clear();
    g.beginFill(0x535353);

    // Body & Head
    g.drawRect(12, 12, 22, 10);
    g.drawRect(30, 8, 12, 8); // Beak

    // Tail
    g.drawRect(0, 14, 14, 4);

    // Wings Flapping
    if (wingFrame === 0) {
      // Wings Up
      g.drawRect(16, 0, 10, 14);
      g.drawRect(12, -8, 8, 10);
    } else {
      // Wings Down
      g.drawRect(16, 20, 10, 14);
      g.drawRect(12, 30, 8, 10);
    }

    g.endFill();
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
