title = "Magnet Crush";

description = 
`[Hold] 
 Pull, Move
 
[Release] 
 Eject
`;

characters = [
`
l    l 
 llll 
 lYYl
 llll
 l  l
`,
`
 g g
ggggg
gRgRg
ggRgg
 ggg
 g g
`,
`
r
r
r
r
r
`,
];

const G = {
	WIDTH: 110,
	HEIGHT: 110,

	PLAYER_MOVE_SPEED: 0.65,
	PLAYER_FRICTION: 0.9,
	PLAYER_PULL_RANGE: 30,
	PLAYER_PULL_SPEED: 0.1,
	PLAYER_FIRE_SPEED: 15,

	DEBRIS_NUMBER: 12,
	DEBRIS_SIZE_MIN: 3,
	DEBRIS_SIZE_MAX: 6,
	DEBRIS_ATTACH_DISTANCE: 5,
	DEBRIS_ANGLE_ROTATION_SPEED: 0.075,
	DEBRIS_FRICTION: 0.95,
	DEBRIS_SPAWN_SPACING: 10,
	DEBRIS_RESPAWN_TIME: 30,
	DEBRIS_RESPAWN_VARIANCE: 5,

	ENEMY_MOVE_SPEED: 0.25,
	ENEMY_FIRE_RATE: 120,
	ENEMY_INITIAL_SPAWN: 60,
	ENEMY_SPAWN_RATE: 180,
	ENEMY_SPAWN_RATE_MIN: 60,
	ENEMY_SPAWN_SPACING: 20,
	ENEMY_WAIT_DISTANCE: 50,

	EBULLET_SPEED: 0.7,
	EBULLET_MISS: 0.1
}

options = {
	viewSize: {x: G.WIDTH, y: G.HEIGHT},
	isReplayEnabled: true,
	theme: "dark",
	isCapturing: true,
    isCapturingGameCanvasOnly: true,
    captureCanvasScale: 2
};

/**
 * @typedef {{
 * pos: Vector,
 * moveSpeed: number
 * velocity: Vector
 * shootVelocity: Vector
 * isPulling: boolean
 * pullCount: number
 * }} Player
 */

/**
 * @type { Player }
 */
let player;

/**
 * @typedef {{
 * pos: Vector
 * size: number
 * velocity: Vector
 * isPulled: boolean
 * isShot: boolean
 * angleOffset: number
 * respawn: number
 * }} Debris
 */

/**
 * @type { Debris [] }
 */
let debris;

/**
 * @typedef {{
 * pos: Vector,
 * firingCooldown: number
 * }} Enemy
 */

/**
 * @type { Enemy [] }
 */
let enemies;

/**
 * @typedef {{
 * pos: Vector,
 * angle: number,
 * }} EBullet
 */

/**
 * @type { EBullet [] }
 */
let eBullets;

/**
 * @type { number }
 */
 let enemySpawnTimer;

 /**
 * @type { number }
 */
let spawnTime;

function update() {
	//start
	if (!ticks) {
		player = {
            pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
            moveSpeed: G.PLAYER_MOVE_SPEED,
			velocity: vec(0, 0),
			shootVelocity: vec(0, 0),
            isPulling: false,
			pullCount: 0
        };

		debris = times(G.DEBRIS_NUMBER, () => {
            return {
                pos: ExcludeArea(player.pos, G.DEBRIS_SPAWN_SPACING, G.DEBRIS_SPAWN_SPACING),
				size: rnd(G.DEBRIS_SIZE_MIN, G.DEBRIS_SIZE_MAX),
				velocity: vec(0, 0),
				isPulled: false,
				isShot: false,
				angleOffset: 0,
				respawn: 0
            };
        });

		enemies = [];
		eBullets = [];

		spawnTime = G.ENEMY_SPAWN_RATE;
		enemySpawnTimer = G.ENEMY_INITIAL_SPAWN;
	}

	//player
	if (input.isPressed) {
		if (player.pos.distanceTo(input.pos) > player.moveSpeed) {
			player.velocity.x = player.moveSpeed * Math.cos(player.pos.angleTo(input.pos)) / (player.pullCount / 4 + 1);
			player.velocity.y = player.moveSpeed * Math.sin(player.pos.angleTo(input.pos)) / (player.pullCount / 4 + 1);
			//clamp and add if anything else moves the player
		} else {
			player.velocity = vec(0, 0);
		}
	player.isPulling = true;
	} else {
		player.velocity.div(1.05);
		player.isPulling = false;
	}
	player.shootVelocity = player.shootVelocity.mul(G.PLAYER_FRICTION);
	player.pos.add(player.velocity);
	player.pos.add(player.shootVelocity);
	player.pos.clamp(0, G.WIDTH, 0, G.HEIGHT);
	color("black");
	char("a", player.pos);

	//debris
	color("light_blue");
	debris.forEach((d) => {
		if (d.respawn <= 0) {
			if (player.isPulling && d.pos.distanceTo(player.pos) < G.PLAYER_PULL_RANGE) {
				// set pulled to true
				if (d.pos.distanceTo(player.pos) < G.DEBRIS_ATTACH_DISTANCE && !d.isPulled) {
					d.isPulled = true;
					d.angleOffset = player.pos.angleTo(d.pos);
					d.velocity = vec(0, 0);
					player.pullCount += 1;
				}
				// circle around player
				if (d.isPulled) {
					d.angleOffset += G.DEBRIS_ANGLE_ROTATION_SPEED / (d.size / 2);
					var posX = G.DEBRIS_ATTACH_DISTANCE * Math.cos(d.angleOffset) + player.pos.x;
					var posY = G.DEBRIS_ATTACH_DISTANCE * Math.sin(d.angleOffset) + player.pos.y;
					d.pos = vec(posX, posY);
				} else {
					// grab object
					var distancePower = G.PLAYER_PULL_SPEED * G.PLAYER_PULL_RANGE / (d.pos.distanceTo(player.pos) + G.PLAYER_PULL_RANGE) + 0.01;
					d.velocity.x += distancePower * Math.cos(d.pos.angleTo(player.pos));
					d.velocity.y += distancePower * Math.sin(d.pos.angleTo(player.pos));
				}
			}
			
			// shoot debris
			if (!player.isPulling && d.isPulled) {
				var velX = G.PLAYER_FIRE_SPEED * Math.cos(d.angleOffset) / d.size;
				var velY = G.PLAYER_FIRE_SPEED * Math.sin(d.angleOffset) / d.size;
				d.velocity = vec(velX, velY);
				d.isPulled = false;
				d.isShot = true;
				player.pullCount -= 1;
				player.shootVelocity.sub(vec(velX, velY).div(2));
			}
			if (d.isShot && d.velocity.length <= 0.2) {
				d.isShot = false;
			}
			if (d.isShot) {
				color("cyan")
			} else if (d.velocity.length > 0.2 || d.isPulled) {
				color("yellow");
			} else {
				color("light_blue");
			}
			d.velocity = d.velocity.mul(G.DEBRIS_FRICTION);
			box(d.pos, d.size);
			d.pos.add(d.velocity);
		} else {
			d.respawn--;
		}
		
	}) 
	

	// Spawn enemy
	enemySpawnTimer--;
	if (enemySpawnTimer <= 0) {
		enemySpawnTimer = spawnTime + enemies.length * 30;
		enemies.push({
			pos: ExcludeArea(player.pos, G.DEBRIS_SPAWN_SPACING, G.DEBRIS_SPAWN_SPACING),
			firingCooldown: G.ENEMY_FIRE_RATE
		})
	}
	if (spawnTime >= G.ENEMY_SPAWN_RATE_MIN) {
		spawnTime -= 1/30;
	} else {
		spawnTime = G.ENEMY_SPAWN_RATE_MIN;
	}
	console.log(spawnTime);

	// Enemy logic
	enemies.forEach((e) => {
		e.firingCooldown--;
		if (e.pos.distanceTo(player.pos) > G.ENEMY_WAIT_DISTANCE) {
			const ang = e.pos.angleTo(player.pos);
			e.pos.x += G.ENEMY_MOVE_SPEED * Math.cos(ang);
			e.pos.y += G.ENEMY_MOVE_SPEED * Math.sin(ang);
		} else {
			if (e.firingCooldown <= 0) {
				eBullets.push({
					pos: vec(e.pos.x, e.pos.y),
					angle: e.pos.angleTo(player.pos) + rnds(-G.EBULLET_MISS, G.EBULLET_MISS),
				});
				e.firingCooldown = G.ENEMY_FIRE_RATE;
				//play("select");
			}
		}
		color("black");
		char("b", e.pos);
	}) 

	eBullets.forEach((eb) => {
		eb.pos.x += G.EBULLET_SPEED * Math.cos(eb.angle);
        eb.pos.y += G.EBULLET_SPEED * Math.sin(eb.angle);
		color("red");
		bar(eb.pos, 3, 1, eb.angle, 1)
	}) 
	
	// Collision

	// Debris
	remove(debris, (d) => {
        const outOfBounds = !d.pos.isInRect(0, 0, G.WIDTH + d.size/2, G.HEIGHT + d.size/2);

		var isCollidingWithEBullets = false;
		if (!d.isShot && (d.velocity.length > 0.2 || d.isPulled)) {
			color("yellow");
			isCollidingWithEBullets = box(d.pos, d.size).isColliding.rect.red;
			if (isCollidingWithEBullets)
				player.pullCount -= 1;
		}

		if (outOfBounds || isCollidingWithEBullets) {
			debris.push(
				{
					pos: ExcludeArea(player.pos, G.DEBRIS_SPAWN_SPACING, G.DEBRIS_SPAWN_SPACING),
					size: rnd(G.DEBRIS_SIZE_MIN, G.DEBRIS_SIZE_MAX),
					velocity: vec(0, 0),
					isPulled: false,
					isShot: false,
					angleOffset: 0,
					respawn: rnd(G.DEBRIS_RESPAWN_TIME - G.DEBRIS_RESPAWN_VARIANCE, G.DEBRIS_RESPAWN_TIME +  G.DEBRIS_RESPAWN_VARIANCE),
				}
			)
		}
        return (outOfBounds || isCollidingWithEBullets);
    });

	// Enemies
	remove(enemies, (e) => {
        const outOfBounds = !e.pos.isInRect(0, 0, G.WIDTH + 10, G.HEIGHT + 10);
		color("black");
		const isCollidingWithDebris = char("b", e.pos).isColliding.rect.cyan;

		const isCollidingWithPlayer = char("b", e.pos).isColliding.char.a;
        if (isCollidingWithPlayer) {
            end();
            //play("powerUp");
        }

        return (outOfBounds || isCollidingWithDebris);
    });

	// Enemy bullets
	remove(eBullets, (eb) => {
        color("red");
        const isCollidingWithPlayer = bar(eb.pos, 3, 1, eb.angle, 1).isColliding.char.a;

		var isCollidingWithDebris = bar(eb.pos, 3, 1, eb.angle, 1).isColliding.rect.yellow;
		if (!isCollidingWithDebris)
			isCollidingWithDebris = bar(eb.pos, 3, 1, eb.angle, 1).isColliding.rect.cyan;

        if (isCollidingWithPlayer) {
            end();
            //play("powerUp"); 
        }
        return (!eb.pos.isInRect(0, 0, G.WIDTH, G.HEIGHT) || isCollidingWithDebris);
    });
	
}

function ExcludeArea(pos, width, height) {
    var posX = rnd(0, 1) < 0.5 ? rnd(0, pos.x - width) : rnd(pos.x + width, G.WIDTH);
	var posY = rnd(0, 1) < 0.5 ? rnd(0, pos.y - height) : rnd(pos.y + height, G.HEIGHT);
    const vector = vec(posX, posY);
    return vector;
}