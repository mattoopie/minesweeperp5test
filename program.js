var field;
	var squareSize;
	function setup(){
		createCanvas(windowWidth-windowWidth/20,windowHeight-windowHeight/20);
		var size = 30;
		if (width>height){
			squareSize = height/size;
		} else {
			squareSize = width/size;
		}
		field = new Field(size,size, squareSize);
		textAlign(CENTER,CENTER);
		noLoop();
		redraw();
	}
	
	function draw(){
		field.draw();
	}
	
	function mousePressed(){
		if (!field.isReplaying() && mouseX<width && mouseY<height){
			field.mousePressed(mouseX,mouseY,mouseButton);
		}
		redraw();
		return false;
	}
	
	function keyPressed(){
		console.log(keyCode);
		if (keyCode==65){
			field.reset();
		}
		if (keyCode==32){
			field.replayNextStep();
		}
		if (keyCode==82){
			field.startNewGame();
		}
		if (keyCode==70){
			if (!field.isReplaying() && mouseX<width && mouseY<height){
				field.mousePressed(mouseX,mouseY,RIGHT);
			}
		}
		redraw();
	}
	
	function Field( width,  height, tileSize) {
		this.tileSize = tileSize;
		this.height = height;
		this.width = width;
		this.tiles;
	this.gameOver;
	this.moves;
	this.replayStep;
	this.replaying;
	this.numberOfBombs;
		this.startNewGame();
	}

	Field.prototype.startNewGame = function() {
		this.moves = [];
		var numberOfBombs = 0;
		this.replayStep = 0;
		this.replaying = false;
		this.gameOver = false;
		this.tiles = new Array(this.height);
		for (var y = 0; y < this.height; y++) {
			var arrayY = new Array(this.width);
			for (var x = 0; x < this.width; x++) {
				var bomb = false;
				if (Math.random()*20 < 3) {
					bomb = true;
					numberOfBombs++;
				}
				arrayY[x] = new Tile(x, y, bomb);
			}
			this.tiles[y] = arrayY;
		}
		this.numberOfBombs = numberOfBombs;
		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				var tile = this.tiles[y][x];
				if (!tile.isBomb()) {
					var number = this.getNumberOfBombsAround(tile);
					tile.setNumber(number);
				}
			}
		}
	}

	Field.prototype.draw = function() {
		for (var y = 0; y < this.tiles.length; y++) {
			for (var x = 0; x < this.tiles[0].length; x++) {
				this.tiles[y][x].draw(this.tileSize);
			}
		}
	}

	Field.prototype.getIndicesAroundTile = function(tile) {
		var x = tile.getX();
		var y = tile.getY();
		var startIndexX;
		var startIndexY;
		var endIndexX;
		var endIndexY;
		if (x > 0) {
			startIndexX = x - 1;
		} else {
			startIndexX = x;
		}
		if (y > 0) {
			startIndexY = y - 1;
		} else {
			startIndexY = y;
		}
		if (x < this.tiles[0].length - 1) {
			endIndexX = x + 1;
		} else {
			endIndexX = x;
		}
		if (y < this.tiles.length - 1) {
			endIndexY = y + 1;
		} else {
			endIndexY = y;
		}
		return [ startIndexX, endIndexX, startIndexY, endIndexY ];
	}

	Field.prototype.getNumberOfBombsAround = function(tile) {
		var number = 0;
		var indices = this.getIndicesAroundTile(tile);

		for (var yH = indices[2]; yH <= indices[3]; yH++) {
			for (var xH = indices[0]; xH <= indices[1]; xH++) {
				if (this.tiles[yH][xH].isBomb()) {
					number++;
				}
			}
		}

		return number;
	}

	Field.prototype.mousePressed = function(mouseX, mouseY, mouseButton) {
		if (!this.gameOver) {
			var tile = this.getTileOnLocation(mouseX, mouseY);
			if (mouseButton == LEFT) {
				if (!tile.isFlagged()) {
					if (!this.replaying) {
						this.moves.push([ mouseX, mouseY, mouseButton ]);
					}
					this.gameOver = tile.reveal();
					this.checkIfGameWon();
					if (!tile.isBomb() && tile.getNumberOfBombsAround() == 0) {
						var tilesRevealed = [];
						this.revealAround(tilesRevealed, tile);
					}
				}
			} else if (mouseButton == RIGHT){
				tile.flag();
				if (!this.replaying) {
					this.moves.push([mouseX, mouseY, mouseButton]);
				}
			} 
		}
	}

	Field.prototype.checkIfGameWon = function() {
		var numberOfFlaggedBombs = 0;
		var numberOfRevealed = 0;
		for (var y = 0; y < this.tiles.length; y++) {
			for (var x = 0; x < this.tiles[0].length; x++) {
				if (this.tiles[y][x].isBomb() && this.tiles[y][x].isFlagged()){
					numberOfFlaggedBombs++;
				} else if(this.tiles[y][x].isRevealed()){
					numberOfRevealed++;
				}
			}
		}
		if (numberOfFlaggedBombs == this.numberOfBombs && (this.width*this.height-this.numberOfBombs)==numberOfRevealed){
			this.gameOver = true;
			//System.out.println("Game won!");
		}
	}

	Field.prototype.reset = function() {
		for (var y = 0; y < this.tiles.length; y++) {
			for (var x = 0; x < this.tiles[0].length; x++) {
				this.tiles[y][x].hide();
				this.tiles[y][x].setFlag(false);
			}
		}
		this.replayStep = 0;
		this.gameOver = false;
		this.replaying = true;
	}

	Field.prototype.replayNextStep = function() {
		if (this.replayStep + 1 <= this.moves.length) {
			var step = this.moves[this.replayStep];
			this.mousePressed(step[0], step[1], step[2]);
			this.replayStep++;
		}
		if (this.replayStep == this.moves.length){
			this.replaying = false;
		}
	}

	Field.prototype.isReplaying = function() {
		return this.replaying;
	}

	Field.prototype.revealAround = function(tilesRevealed, tile) {
		var indices = this.getIndicesAroundTile(tile);
		for (var yH = indices[2]; yH <= indices[3]; yH++) {
			for (var xH = indices[0]; xH <= indices[1]; xH++) {
				var newTile = this.tiles[yH][xH];
				newTile.reveal();
				if (newTile.getNumberOfBombsAround() == 0 && !(tilesRevealed.indexOf(newTile)>-1)) {
					tilesRevealed.push(newTile);
					this.revealAround(tilesRevealed, newTile);
				}
			}
		}
	}

	Field.prototype.getTileOnLocation = function(x, y) {
		var indexX = parseInt(x / this.tileSize);
		var indexY = parseInt(y / this.tileSize);
		return this.tiles[indexY][indexX];
	}
	
	

	function Tile( x,  y,  bomb) {
		this.x = x;
		this.y = y;
		this.bomb = bomb;
		this.numberOfBombsAround = 0;
		this.revealed = false;
		this.flagged = false;
	}

	Tile.prototype.isBomb = function() {
		return this.bomb;
	}

	Tile.prototype.getX = function() {
		return this.x;
	}

	Tile.prototype.getY = function() {
		return this.y;
	}

	Tile.prototype.setNumber = function(number) {
		if (number >= 0) {
			this.numberOfBombsAround = number;
		}
	}

	Tile.prototype.draw = function(tileSize) {
		if (this.revealed) {
			if (this.bomb) {
				fill(color(255, 0, 0));
			} else {
				fill(255);
			}
		} else if (this.flagged){
			fill(color(150,150,0));
		} else {
			fill(62);
		}
		rect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
		if (!this.bomb && this.numberOfBombsAround > 0 && this.revealed) {
			fill(0);
			textSize(2*tileSize/3);
			text(this.numberOfBombsAround, this.x * tileSize + tileSize / 2, this.y * tileSize + tileSize / 2);
		}
	}

	Tile.prototype.flag = function() {
		this.flagged = !this.flagged;
	}
	Tile.prototype.setFlag = function(state) {
		this.flagged = state;
	}
	
	Tile.prototype.isFlagged= function(){
		return this.flagged;
	}
	
	Tile.prototype.isRevealed= function(){
		return this.revealed;
	}
	
	Tile.prototype.reveal= function(){
		this.revealed = true;
		if (this.bomb){
			return true;
		}
		return false;
	}
	
	Tile.prototype.hide= function(){
		this.revealed = false;
	}
	
	Tile.prototype.getNumberOfBombsAround = function() {
		return this.numberOfBombsAround;
	}