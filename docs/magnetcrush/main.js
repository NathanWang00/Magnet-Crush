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
 l  l
 llll
 l  l
`
];

const G = {
	WIDTH: 110,
	HEIGHT: 110,

	PLAYER_MOVE_SPEED: 0.3,
	PLAYER_PULL_RANGE: 30,
	PLAYER_PULL_SPEED: 0.02,

	DEBRIS_NUMBER: 10,
	DEBRIS_SIZE_MIN: 3,
	DEBRIS_SIZE_MAX: 5,
	DEBRIS_FRICTION: 0.5,
	DEBRIS_ATTACH_DISTANCE: 5,
	DEBRIS_ANGLE_ROTATION_SPEED: 0.1
}

options = {
	viewSize: {x: G.WIDTH, y: G.HEIGHT}
};

/**
 * @typedef {{
 * pos: Vector,
 * moveSpeed: number,
 * velocity: Vector,
 * isPulling: boolean
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
 * angleOffset: number
 * }} Debris
 */

/**
 * @type { Debris [] }
 */
let debris;

function update() {
	//start
	if (!ticks) {
		player = {
            pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
            moveSpeed: G.PLAYER_MOVE_SPEED,
			velocity: vec(0, 0),
            isPulling: false
        };

		debris = times(G.DEBRIS_NUMBER, () => {
            const posX = rnd(0, G.WIDTH);
            const posY = rnd(0, G.HEIGHT);
            return {
                pos: vec(posX, posY),
				size: rnd(G.DEBRIS_SIZE_MIN, G.DEBRIS_SIZE_MAX),
				velocity: vec(0, 0),
				isPulled: false,
				angleOffset: 0
            };
        });
	}

	//player
	if (input.isPressed) {
		if (player.pos.distanceTo(input.pos) > player.moveSpeed) {
			player.velocity.x = player.moveSpeed * Math.cos(player.pos.angleTo(input.pos));
			player.velocity.y = player.moveSpeed * Math.sin(player.pos.angleTo(input.pos));
			//clamp and add if anything else moves the player
		} else {
			player.velocity = vec(0, 0);
		}
	player.isPulling = true;
	} else {
		player.velocity.div(1.05);
		player.isPulling = false;
	}
	player.pos.add(player.velocity);
	player.pos.clamp(0, G.WIDTH, 0, G.HEIGHT);
	color("black");
	char("a", player.pos);

	//debris
	color("light_blue");
	debris.forEach((d) => {
		if (player.isPulling && d.pos.distanceTo(player.pos) < G.PLAYER_PULL_RANGE) {
			if (d.pos.distanceTo(player.pos) < G.DEBRIS_ATTACH_DISTANCE && !d.isPulled) {
				d.isPulled = true;
				d.angleOffset = player.pos.angleTo(d.pos);
			}
			if (d.isPulled) {
				d.angleOffset += G.DEBRIS_ANGLE_ROTATION_SPEED;
				var posX = G.DEBRIS_ATTACH_DISTANCE * Math.cos(d.angleOffset) + player.pos.x;
				var posY = G.DEBRIS_ATTACH_DISTANCE * Math.sin(d.angleOffset) + player.pos.y;
				d.pos = vec(posX, posY);
			} else {
				var distancePower = G.PLAYER_PULL_SPEED * G.PLAYER_PULL_RANGE / (d.pos.distanceTo(player.pos) + G.PLAYER_PULL_RANGE) + 0.01;
				d.velocity.x += distancePower * Math.cos(d.pos.angleTo(player.pos));
				d.velocity.y += distancePower * Math.sin(d.pos.angleTo(player.pos));
				d.pos.add(d.velocity);
				//d.velocity.clamp(-G.PLAYER_PULL_SPEED, G.PLAYER_PULL_SPEED, -G.PLAYER_PULL_SPEED, G.PLAYER_PULL_SPEED);
			}
		}
		box(d.pos, d.size);
	}) 
	
}