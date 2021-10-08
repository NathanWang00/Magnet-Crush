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
	PLAYER_PULL_RANGE: 25
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

function update() {
	//start
	if (!ticks) {
		player = {
            pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
            moveSpeed: G.PLAYER_MOVE_SPEED,
			velocity: vec(0, 0),
            isPulling: false
        };
	}

	//player
	if (input.isPressed) {
		if (player.pos.distanceTo(input.pos) > player.moveSpeed) {
			player.velocity.x = player.moveSpeed * Math.cos(player.pos.angleTo(input.pos));
			player.velocity.y = player.moveSpeed * Math.sin(player.pos.angleTo(input.pos));
		} else {
			player.velocity = vec(0, 0);
		}
			
		
	} else {
		player.velocity.div(1.05);
	}
	player.pos.add(player.velocity);

	color("black");
	char("a", player.pos);
}
