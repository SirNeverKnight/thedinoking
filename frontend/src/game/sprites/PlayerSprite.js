import * as PIXI from 'pixi.js';
import { hexToNumber, getDinoColorHex } from '../utils/lerp';

export class PlayerSprite {
  constructor(userId, username, colorId) {
    this.userId = userId;
    this.username = username;
    this.colorId = colorId;
    
    this.container = new PIXI.Container();
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);

    // Player Name Text
    this.nameText = new PIXI.Text(username, {
      fontFamily: 'Press Start 2P',
      fontSize: 10,
      fill: 0x202124,
      align: 'center',
    });
    this.nameText.anchor.set(0.5, 1);
    this.nameText.position.set(22, -12);
    this.container.addChild(this.nameText);

    this.animFrame = 0;
    this.colorHex = getDinoColorHex(colorId);
    this.colorNum = hexToNumber(this.colorHex);

    this.renderDino(false, 0);
  }

  update(x, y, isAlive, tickCount) {
    this.container.position.set(x, y);
    this.animFrame = Math.floor(tickCount / 3) % 2;
    this.renderDino(!isAlive, this.animFrame);
  }

  renderDino(isDead, animFrame) {
    const g = this.graphics;
    g.clear();

    const color = isDead ? 0x888888 : this.colorNum;

    // Dino Body & Head
    g.beginFill(color);
    // Head & Snout
    g.drawRect(20, -44, 24, 20);
    g.drawRect(36, -38, 8, 12);
    // Neck & Body
    g.drawRect(14, -28, 20, 20);
    g.drawRect(4, -20, 26, 16);
    // Tail
    g.drawRect(-4, -18, 10, 8);
    g.drawRect(-8, -14, 6, 4);
    // Arm
    g.drawRect(26, -18, 8, 4);
    g.endFill();

    // Eye
    if (isDead) {
      // Red Dead X Eye
      g.lineStyle(2, 0xFF0000);
      g.moveTo(26, -38); g.lineTo(32, -32);
      g.moveTo(32, -38); g.lineTo(26, -32);
      g.lineStyle(0);
    } else {
      // Living Eye
      g.beginFill(0xFFFFFF);
      g.drawRect(28, -38, 6, 6);
      g.endFill();
      g.beginFill(0x000000);
      g.drawRect(30, -36, 3, 3);
      g.endFill();
    }

    // Legs Animation
    g.beginFill(color);
    if (animFrame === 0) {
      g.drawRect(8, -4, 6, 8);
      g.drawRect(22, -8, 6, 8);
    } else {
      g.drawRect(8, -8, 6, 8);
      g.drawRect(22, -4, 6, 8);
    }
    g.endFill();
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
