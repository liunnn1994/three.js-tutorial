export default class EventEmitter {
  constructor() {
    this.callbacks = {};
    this.callbacks.base = {};
  }

  on(_names, callback) {
    // 错误
    if (typeof _names === "undefined" || _names === "") {
      console.warn("wrong names");
      return false;
    }

    if (typeof callback === "undefined") {
      console.warn("wrong callback");
      return false;
    }

    // 解析名称
    const names = this.resolveNames(_names);

    // 每个名称
    names.forEach((_name) => {
      // 解析名称
      const name = this.resolveName(_name);

      // 如果不存在则创建命名空间
      if (!(this.callbacks[name.namespace] instanceof Object)) this.callbacks[name.namespace] = {};

      // 如果不存在则创建回调
      if (!(this.callbacks[name.namespace][name.value] instanceof Array))
        this.callbacks[name.namespace][name.value] = [];

      // 添加回调
      this.callbacks[name.namespace][name.value].push(callback);
    });

    return this;
  }

  off(_names) {
    // 错误
    if (typeof _names === "undefined" || _names === "") {
      console.warn("wrong name");
      return false;
    }

    // 解析名称
    const names = this.resolveNames(_names);

    // 每个名称
    names.forEach((_name) => {
      // 解析名称
      const name = this.resolveName(_name);

      // 移除命名空间
      if (name.namespace !== "base" && name.value === "") {
        delete this.callbacks[name.namespace];
      }

      // 移除命名空间中的特定回调
      else {
        // 默认
        if (name.namespace === "base") {
          // 尝试从每个命名空间中移除
          for (const namespace in this.callbacks) {
            if (
              this.callbacks[namespace] instanceof Object &&
              this.callbacks[namespace][name.value] instanceof Array
            ) {
              delete this.callbacks[namespace][name.value];

              // 如果为空则移除命名空间
              if (Object.keys(this.callbacks[namespace]).length === 0)
                delete this.callbacks[namespace];
            }
          }
        }

        // 指定命名空间
        else if (
          this.callbacks[name.namespace] instanceof Object &&
          this.callbacks[name.namespace][name.value] instanceof Array
        ) {
          delete this.callbacks[name.namespace][name.value];

          // 如果为空则移除命名空间
          if (Object.keys(this.callbacks[name.namespace]).length === 0)
            delete this.callbacks[name.namespace];
        }
      }
    });

    return this;
  }

  trigger(_name, _args) {
    // 错误
    if (typeof _name === "undefined" || _name === "") {
      console.warn("wrong name");
      return false;
    }

    let finalResult = null;
    let result = null;

    // 默认参数
    const args = !(_args instanceof Array) ? [] : _args;

    // 解析名称
    let name = this.resolveNames(_name);

    // 解析名称
    name = this.resolveName(name[0]);

    // 默认命名空间
    if (name.namespace === "base") {
      // 尝试在每个命名空间中查找回调
      for (const namespace in this.callbacks) {
        if (
          this.callbacks[namespace] instanceof Object &&
          this.callbacks[namespace][name.value] instanceof Array
        ) {
          this.callbacks[namespace][name.value].forEach(function (callback) {
            result = callback.apply(this, args);

            if (typeof finalResult === "undefined") {
              finalResult = result;
            }
          });
        }
      }
    }

    // 指定命名空间
    else if (this.callbacks[name.namespace] instanceof Object) {
      if (name.value === "") {
        console.warn("wrong name");
        return this;
      }

      this.callbacks[name.namespace][name.value].forEach(function (callback) {
        result = callback.apply(this, args);

        if (typeof finalResult === "undefined") finalResult = result;
      });
    }

    return finalResult;
  }

  resolveNames(_names) {
    let names = _names;
    names = names.replace(/[^a-zA-Z0-9 ,/.]/g, "");
    names = names.replace(/[,/]+/g, " ");
    names = names.split(" ");

    return names;
  }

  resolveName(name) {
    const newName = {};
    const parts = name.split(".");

    newName.original = name;
    newName.value = parts[0];
    newName.namespace = "base"; // Base namespace

    // 指定命名空间
    if (parts.length > 1 && parts[1] !== "") {
      newName.namespace = parts[1];
    }

    return newName;
  }
}
