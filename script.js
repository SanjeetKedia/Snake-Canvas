"use strict";

window.addEventListener("load", function () {
  /**
   * @type {HTMLCanvasElement}
   */

  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 600;
  canvas.height = 600;

  const snakeInfo = [
    {
      name: "tail",
      sx: 0,
    },
    {
      name: "body",
      sx: 1,
    },
    {
      name: "turn-left",
      sx: 2,
    },
    {
      name: "turn-right",
      sx: 3,
    },
    {
      name: "head",
      sx: 4,
    },
    {
      name: "right",
      sy: 0,
    },
    {
      name: "down",
      sy: 1,
    },
    {
      name: "left",
      sy: 2,
    },
    {
      name: "up",
      sy: 3,
    },
  ];

  const appleInfo = {
    sx: 0,
    sy: 4,
  };

  const spriteInfo = {
    sizeModifier: 0.75,
    width: 64,
    height: 64,
    turnWidth: 10,
    turnHeight: 10,
  };

  function drawSprite(obj) {
    ctx.drawImage(
      obj.image,
      obj.sx * obj.spriteWidth,
      obj.sy * obj.spriteHeight,
      obj.spriteWidth,
      obj.spriteHeight,
      obj.x,
      obj.y,
      obj.width,
      obj.height
    );
  }

  function findTurn(obj, direction) {
    const facing = obj.facing;
    let turnDir;
    switch (facing) {
      case "left":
        if (direction == "up") turnDir = "right";
        else if (direction == "down") turnDir = "left";
        break;
      case "up":
        if (direction == "left") turnDir = "left";
        else if (direction == "right") turnDir = "right";
        break;
      case "right":
        if (direction == "up") turnDir = "left";
        else if (direction == "down") turnDir = "right";
        break;
      case "down":
        if (direction == "left") turnDir = "right";
        else if (direction == "right") turnDir = "left";
        break;
    }
    if (!turnDir) turnDir = "";
    return turnDir;
  }

  let gameFrames = 1;
  let snakeArr = [];
  let appleArr = [];
  let turnArr = [];
  let startingFacing = "up";
  let score = 0;
  let gameOver = false;
  const startingSize = 3;
  class Game {
    constructor(ctx) {
      this.ctx = ctx;
      this.appleSpawnTime = Math.floor(Math.random() * 100 + 200);

      // inits
      for (let i = 0; i < startingSize; i++) {
        this.#newSnakePart();
      }
      this.#newApple();
    }
    update(deltaTime) {
      // Game Over Handler
      if (gameOver) {
        this.appleSpawnTime = 0;
        snakeArr.forEach((part) => {
          part.dx = 0;
          part.dy = 0;
        });
        return;
      }

      // Collission detection for apple and Snake
      const snakeHead = snakeArr[0];
      const col = 0.5;
      if (appleArr.length > 0) {
        appleArr.forEach((apple) => {
          if (
            apple.x + apple.width * col < snakeHead.x + snakeHead.width &&
            apple.y + apple.width * col < snakeHead.y + snakeHead.height &&
            apple.x + apple.width > snakeHead.x + snakeHead.width * col &&
            apple.y + apple.height > snakeHead.y + snakeHead.height * col
          ) {
            apple.markedForDeletion = true;
            score++;
            this.#newSnakePart();
          }
        });
      }

      // Spawn New Apple
      if (gameFrames % this.appleSpawnTime == 0) {
        this.#newApple();
        gameFrames = 0;
      }
      gameFrames++;

      // Fist is head;
      snakeArr[0].sx = 4;
      // Last is Tail
      snakeArr[snakeArr.length - 1].sx = 0;

      turnArr = turnArr.filter((turn) => turn.markedForDeletion == false);

      turnArr.forEach((part) => part.update(deltaTime));
      appleArr.forEach((part) => part.update(deltaTime));
      snakeArr.forEach((part) => part.update(deltaTime));
    }
    draw() {
      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw background
      ctx.drawImage(background, 0, 0, canvas.width + 5, canvas.height + 5);
      //   Draw snake

      this.drawScore();
      // turnArr.forEach((part) => part.draw());
      appleArr.forEach((part) => part.draw());
      snakeArr.forEach((part) => part.draw());
    }
    drawScore() {
      ctx.font = "30px serif";
      ctx.fillStyle = "black";
      ctx.textAlign = "start";
      ctx.fillText(`Score: ${score}🍎`, 5, 30);
    }
    #newSnakePart() {
      const partInfo = {};

      let newX = 0,
        newY = 0;

      // If it is first part of snake it will be in middle of canavs
      if (snakeArr.length == 0) {
        partInfo.x = 300; //canvas.width * 0.5;
        partInfo.y = canvas.height * 0.5;
      } else {
        let lastPiece = snakeArr[snakeArr.length - 1];
        // it will be behind the last piece

        if (lastPiece.facing == "right") {
          newX = -1;
        } else if (lastPiece.facing == "left") {
          newX = 1;
        } else if (lastPiece.facing == "up") {
          newY = 1;
        } else if (lastPiece.facing == "down") {
          newY = -1;
        }
        partInfo.x =
          newX * (spriteInfo.width * spriteInfo.sizeModifier) + lastPiece.x;
        partInfo.y =
          newY * (spriteInfo.height * spriteInfo.sizeModifier) + lastPiece.y;
      }

      const startingsy = snakeInfo.find(
        (part) => part.name == startingFacing
      ).sy;
      const newDirection =
        snakeArr.length > 0 ? snakeArr[snakeArr.length - 1].sy : startingsy;
      const newBodyPart = 1;
      partInfo.sy = newDirection;
      partInfo.sx = newBodyPart;
      if (snakeArr.length > 0)
        partInfo.facing = snakeArr[snakeArr.length - 1].facing;
      else partInfo.facing = startingFacing;
      snakeArr.push(new Snake(this, partInfo));
    }
    #newApple() {
      appleArr.push(new Apple());
      // console.log(snakeArr);
    }
  }

  class Snake {
    constructor(game, partInfo) {
      //   this.game = game;
      this.ctx = game.ctx;
      this.spriteWidth = spriteInfo.width;
      this.spriteHeight = spriteInfo.height;
      this.width = this.spriteWidth * spriteInfo.sizeModifier;
      this.height = this.spriteHeight * spriteInfo.sizeModifier;
      this.x = partInfo.x;
      this.y = partInfo.y;
      this.speed = 3;
      this.dx;
      this.dy;
      this.sx = partInfo.sx;
      this.sy = partInfo.sy;
      this.image = snake;
      this.turning;
      this.facing = partInfo.facing;
    }
    update(deltaTime) {
      const snakeHead = snakeArr[0];

      // Snake Defaults
      snakeArr[0].sx = 4;
      snakeArr[snakeArr.length - 1].sx = 0;

      snakeArr.forEach((part, i) => {
        if (i !== 0 && i !== snakeArr.length - 1) {
          if (part.turning == "left") part.sx = 2;
          else if (part.turning == "right") part.sx = 3;
          else part.sx = 1;
        }
      });

      // Collission between snake and border
      if (
        snakeHead.x < 0 ||
        snakeHead.x + snakeHead.width > canvas.width ||
        snakeHead.y < 0 ||
        snakeHead.y + snakeHead.height > canvas.height
      ) {
        gameOver = true;
      }

      // Setting the direction
      if (this.facing == "right") {
        this.dx = this.speed;
        this.dy = 0;
        this.sy = 0;
      } else if (this.facing == "left") {
        this.dx = -this.speed;
        this.dy = 0;
        this.sy = 2;
      } else if (this.facing == "up") {
        this.dx = 0;
        this.dy = -this.speed;
        this.sy = 3;
      } else if (this.facing == "down") {
        this.dx = 0;
        this.dy = this.speed;
        this.sy = 1;
      }

      this.x += this.dx;
      this.y += this.dy;
    }
    draw() {
      drawSprite(this);
    }
  }

  class Apple {
    constructor() {
      this.spriteWidth = spriteInfo.width;
      this.spriteHeight = spriteInfo.height;
      this.width = this.spriteWidth * spriteInfo.sizeModifier;
      this.height = this.spriteHeight * spriteInfo.sizeModifier;
      this.x = Math.random() * (canvas.width - this.width);
      this.y = Math.random() * (canvas.height - this.height);
      this.sx = 0;
      this.sy = 4;
      this.image = snake;
      this.markedForDeletion = false;
      this.frames = 0;
      this.framesTillDelete = 1000;
      this.deleteModifier = 0.2;
    }
    update(deltaTime) {
      if (this.frames > this.framesTillDelete) {
        this.markedForDeletion = true;
        this.frames = 0;
      }
      this.frames += Math.floor(deltaTime * this.deleteModifier);

      appleArr = appleArr.filter((apple) => apple.markedForDeletion === false);
    }
    draw() {
      drawSprite(this);
    }
  }

  class Turn {
    constructor(x, y, turn) {
      this.markedForDeletion = false;
      this.width = spriteInfo.width * spriteInfo.sizeModifier;
      this.height = spriteInfo.height * spriteInfo.sizeModifier;
      this.x = x;
      this.y = y;
      this.turn = turn;
      this.deleteSize = snakeArr.length;
      this.size = 0;
    }
    update(deltaTime) {
      // Detect collission
      snakeArr.forEach((part) => {
        if (
          part.x + part.width > this.x &&
          part.x < this.x + this.width &&
          part.y + part.height > this.y &&
          part.y < this.y + this.height
        ) {
          switch (this.turn) {
            case "left":
              part.turning = findTurn(part, "left");
              part.dx = -this.speed;
              part.dy = 0;
              part.facing = "left";
              break;
            case "right":
              part.turning = findTurn(part, "right");
              part.dx = this.speed;
              part.dy = 0;
              part.facing = "right";
              break;
            case "up":
              part.turning = findTurn(part, "up");
              part.dx = 0;
              part.dy = -this.speed;
              part.facing = "up";
              break;
            case "down":
              part.turning = findTurn(part, "down");
              part.dx = 0;
              part.dy = this.speed;
              part.facing = "down";
          }
          this.size = 0;
        } else {
          part.turning = "";
          this.size++;
        }

        this.deleteSize = snakeArr.length;
        if (this.size > this.deleteSize) this.markedForDeletion = true;
        console.log(this.size, this.deleteSize);
      });
    }
    draw() {
      if (this.turn == "right") ctx.fillStyle = "red";
      else if (this.turn == "left") ctx.fillStyle = "blue";

      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  const game = new Game(ctx);

  let lastTimeStamp = 1;
  function animate(timeStamp) {
    // calculating deltaTime
    const deltaTime = timeStamp - lastTimeStamp;
    lastTimeStamp = timeStamp;

    game.update(deltaTime);
    game.draw();

    requestAnimationFrame(animate);
  }
  animate(0);

  this.addEventListener("keypress", function (e) {
    const snakeHead = snakeArr[0];
    let diffX = 0;
    let diffY = 0;

    if (snakeHead.facing == "left") {
      diffX = -snakeHead.width || 0;
    } else if (snakeHead.facing == "right") {
      diffX = snakeHead.width || 0;
    } else if (snakeHead.facing == "up") {
      diffY = -snakeHead.width || 0;
    } else if (snakeHead.facing == "down") {
      diffY = snakeHead.width || 0;
    }

    switch (e.key) {
      case "a":
        if (snakeHead.facing != "right") {
          turnArr.push(
            new Turn(snakeHead.x + diffX, snakeHead.y + diffY, "left")
          );
        }
        // if (snakeHead.facing != "right") snakeHead.facing = "left";
        break;
      case "s":
        if (snakeHead.facing != "up") {
          turnArr.push(
            new Turn(snakeHead.x + diffX, snakeHead.y + diffY, "down")
          );
        }
        // if (snakeHead.facing != "up") snakeHead.facing = "down";
        break;
      case "d":
        if (snakeHead.facing != "left") {
          turnArr.push(
            new Turn(snakeHead.x + diffX, snakeHead.y + diffY, "right")
          );
        }
        // if (snakeHead.facing != "left") snakeHead.facing = "right";
        break;
      case "w":
        if (snakeHead.facing != "down") {
          turnArr.push(
            new Turn(snakeHead.x + diffX, snakeHead.y + diffY, "up")
          );
        }
        break;
    }
  });
});
