export default class Othello {
  constructor() {
    this.order = 1;
    this.color = [null, 'black', 'white'];
    this.history = [];
  }
  writeOn(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.size = Math.min(canvasElement.height, canvasElement.width);
    this.pixcel = this.size / 8;
    this.backgroundColor = 'green';
    this.board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 1, 0, 0, 0],
      [0, 0, 0, 1, 2, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    this.clickEvent = (e) => {
      this.mouseX = Math.floor(e.offsetX / this.pixcel);
      this.mouseY = Math.floor(e.offsetY / this.pixcel);
      if (0 <= this.mouseX <= 8 && 0 <= this.mouseY <= 8) {
        this.putOn(this.mouseX, this.mouseY);
        this.readHistory();
      }
    };
    return this;
  }
  get winner() {
    return new Promise((resolve, reject) => {
      setInterval(() => {
        if (this.win == 'decide') {
          let white = 0;
          let black = 0;
          this.board
            .reduce((a, b) => [...a, ...b])
            .forEach((v) => {
              if (v === 1) {
                black++;
              }
              if (v === 2) {
                white++;
              }
            });
          if (white < black) {
            resolve('black');
          }
          if (black < white) {
            resolve('white');
          }
          if (black === white) {
            resolve('draw');
          }
        }
      }, 1000);
    });
  }
  enableClickToPut() {
    if (!this.canvas) return this;
    this.canvas.addEventListener('click', this.clickEvent);
    return this;
  }
  disableClickToPut() {
    if (!this.canvas) return this;
    this.canvas.removeEventListener('click', this.clickEvent);
    return this;
  }
  at(x, y) {
    if (this.board[y] === undefined) return undefined;
    return this.board[y][x];
  }
  setAt(x, y, value) {
    if (this.board[y] !== undefined) {
      if (this.board[y][x] !== undefined) {
        this.board[y][x] = value;
      }
    }
  }
  drow() {
    if (!this.canvas) return this;
    this.drowGrid();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (this.board[i][j] === 1) {
          this.ctx.beginPath();
          this.ctx.fillStyle = 'black';
          this.ctx.arc(
            (j + 0.5) * this.pixcel,
            (i + 0.5) * this.pixcel,
            (this.pixcel * 2) / 5,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        } else if (this.board[i][j] === 2) {
          this.ctx.beginPath();
          this.ctx.fillStyle = 'white';
          this.ctx.arc(
            (j + 0.5) * this.pixcel,
            (i + 0.5) * this.pixcel,
            (this.pixcel * 2) / 5,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
      }
    }
    return this;
  }
  canPutAt(x, y, color) {
    //上から時計回り
    if (this.at(x, y) !== 0)
      return Array(8)
        .fill(0)
        .map(() => [false, 0]);
    let coo = [
      [0, -1],
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
    ];
    let other;
    if (color === 1) {
      other = 2;
    } else if (color === 2) {
      other = 1;
    }
    let directions = Array(8).fill(false);
    directions = directions.map((_, i) => {
      let co = coo[i];
      if (this.at(x + co[0], y + co[1]) === other) {
        return true;
      } else {
        return false;
      }
    });
    directions = directions.map((value, index) => {
      if (!value) return [false, 0];
      let i = 2;
      while (true) {
        let co = coo[index];
        let it = this.at(x + co[0] * i, y + co[1] * i);
        if (it === undefined || it === 0) return [false, 0];
        if (it === color) return [true, i];
        i++;
      }
    });
    return directions;
  }
  putOn(x, y) {
    this.history.push([x, y]);
    return this;
  }
  readHistory() {
    //historyから最新の盤面を計算する
    this.board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    let coo = [
      [0, -1],
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
    ];
    for (let i = 0; i < this.history.length; i++) {
      let vs = this.canPutAt(...this.history[i], (i % 2) + 1);
      if (!vs.map((v) => v[0]).includes(true)){
        this.history.pop();
        return this;
      }
      for (let k = 0; k < vs.length; k++) {
        let co = coo[k];
        for (let l = 0; l <= vs[k][1]; l++) {
          this.setAt(
            this.history[i][0] + co[0] * l,
            this.history[i][1] + co[1] * l,
            (i % 2) + 1
          );
        }
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.size, this.size);
        this.drow();
      }
    }
    if (
      this.getPutablePlace((this.history.length % 2) + 1).length === 0 ||
      (this.getPutablePlace(1).length === 0 &&
        this.getPutablePlace(2).length === 0)
    )
      this.win = 'decide';

    return this;
  }
  getPutablePlace(color) {
    const result = [];
    this.board.forEach((arr, y) => {
      arr.forEach((v, x) => {
        if (this.at(x, y) !== 0) return;

        if (
          this.canPutAt(x, y, color)
            .map((v) => v[0])
            .includes(true)
        ) {
          result.push([x, y]);
        }
      });
    });
    return result;
  }

  drowGrid() {
    if (!this.canvas) return this;
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.size, this.size);
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'black';
    for (let i = 0; i < 8; i++) {
      this.ctx.moveTo(i * this.pixcel, 0);
      this.ctx.lineTo(i * this.pixcel, this.size);
    }
    for (let i = 0; i < 8; i++) {
      this.ctx.moveTo(0, i * this.pixcel);
      this.ctx.lineTo(this.size, i * this.pixcel);
    }
    this.ctx.stroke();
    this.ctx.closePath();
    return this;
  }
}