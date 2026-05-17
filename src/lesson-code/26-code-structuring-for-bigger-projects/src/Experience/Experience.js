import * as THREE from "three";

import Debug from "./Utils/Debug.js";
import Sizes from "./Utils/Sizes.js";
import Time from "./Utils/Time.js";
import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import World from "./World/World.js";
import Resources from "./Utils/Resources.js";

import sources from "./sources.js";

let instance = null;

export default class Experience {
  constructor(_canvas) {
    // 单例
    if (instance) {
      return instance;
    }
    instance = this;

    // 全局访问
    window.experience = this;

    // 选项
    this.canvas = _canvas;

    // 设置
    this.debug = new Debug();
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.resources = new Resources(sources);
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.world = new World();

    // 调整大小事件
    this.sizes.on("resize", () => {
      this.resize();
    });

    // 时间帧事件
    this.time.on("tick", () => {
      this.update();
    });
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();
    this.world.update();
    this.renderer.update();
  }

  destroy() {
    this.sizes.off("resize");
    this.time.off("tick");

    // 遍历整个场景
    this.scene.traverse((child) => {
      // 测试是否为网格
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        // 遍历材质属性
        for (const key in child.material) {
          const value = child.material[key];

          // 测试是否有 dispose 函数
          if (value && typeof value.dispose === "function") {
            value.dispose();
          }
        }
      }
    });

    this.camera.controls.dispose();
    this.renderer.instance.dispose();

    if (this.debug.active) this.debug.ui.destroy();
  }
}
