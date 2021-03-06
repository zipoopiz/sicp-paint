var convas = document.getElementById("sicp");
var context = convas.getContext("2d");


// 向量定义
function Vector(x, y) {
	this.x = x;
	this.y = y;
}

Vector.prototype.add = function(v) {
	return new Vector(this.x + v.x, this.y + v.y);
};

Vector.prototype.sub = function(v) {
	return new Vector(this.x - v.x, this.y - v.y);
};

Vector.prototype.scale = function(s) {
	return new Vector(this.x * s, this.y * s);
};


/////////////////////
// frame坐标转换////
////////////////////
function frame_coord_map(frame) {
	return function(v) {
		return frame.origin.add(
						frame.edge1.scale(v.x).add(
							frame.edge2.scale(v.y)));
	};
}

//////////////////
//painter定义/////
//////////////////
function seg_to_painter(seglist) {
	return function(frame) {
		var coord = frame_coord_map(frame);
		seglist.forEach(function(seg) {
			var start = coord(seg.begin);
			var end = coord(seg.end);
			draw_line(start, end);
		});
	};
}

// 菱形
var diamond = seg_to_painter([
	{"begin":{"x":0, "y":0.5}, "end":{"x":0.5, "y":1.0}},
	{"begin":{"x":0.5, "y":1.0}, "end":{"x":1.0, "y":0.5}},
	{"begin":{"x":1.0, "y":0.5}, "end":{"x":0.5, "y":0}},
	{"begin":{"x":0.5, "y":0}, "end":{"x":0, "y":0.5}}
	]);

/////////////////
//////画线段/////
/////////////////
function draw_line(v1, v2) {
	context.moveTo(v1.x, v1.y);
	context.lineTo(v2.x, v2.y);
	context.stroke();
}


////////////////
// painter转换//
////////////////
function trans_painter(painter, origin, edge1, edge2) {
	return function(frame) {
		var m = frame_coord_map(frame);
		var new_origin = m(origin);
		return painter({"origin":new_origin,
						"edge1":m(edge1).sub(new_origin),
						"edge2":m(edge2).sub(new_origin)});
	};
}
// 将图片垂直翻转
function flip_vert(painter) {
	return trans_painter(painter, new Vector(0, 1), new Vector(1, 1), new Vector(0, 0));
}

// 将图片水平翻转
function flip_horiz(painter) {
	return trans_painter(painter, new Vector(1, 0), new Vector(0, 0), new Vector(1, 1));
}

// 将两张图片左右放置
function beside(painter1, painter2) {
	var split_point = new Vector(0.5, 0);
	var paint_left = trans_painter(painter1, new Vector(0, 0), split_point, new Vector(0, 1.0));
	var paint_right = trans_painter(painter2, split_point, new Vector(1.0, 0), new Vector(0.5, 1.0));
	return function(frame) {
		paint_left(frame);
		paint_right(frame);
	};
}

// 将两张图片上下放置
function below(painter1, painter2) {
	var split_point = new Vector(0, 0.5);
	var paint_up = trans_painter(painter2, new Vector(0, 0), new Vector(1.0, 0), split_point);
	var paint_down = trans_painter(painter1, split_point, new Vector(1.0, 0.5), new Vector(0, 1.0));
	return function(frame) {
		paint_down(frame);
		paint_up(frame);
	};
}

// 递归的图形构造， 将图形分成相等的两部分， 一上一下放在原图的右边
function right_split(painter, n) {
	if (n === 0) {
		return painter;
	} else {
		var smaller = right_split(painter, n - 1);
		return beside(painter, below(smaller, smaller));
	}
}


// 递归的图形构造， 将图形分成相等的两部分， 一左一右放在原图的上边
function up_split(painter, n) {
	if (n === 0) {
		return painter;
	} else {
		var smaller = up_split(painter, n - 1);
		return below(painter, beside(smaller, smaller));
	}
}

// 递归的图形构造， 将图形放在frame的四个地方， 原图放在左下角， 左上角是up_split, 右上角是corner_split， 右下角是right_split
function corner_split(painter, n) {
	if (n === 0) {
		return painter;
	} else {
		var up = up_split(painter, n - 1);
		var right = right_split(painter, n - 1);
		var corner = corner_split(painter, n - 1);
		var top_left = beside(up, up);
		var bottom_right = below(right, right);
		return beside(below(painter, top_left), below(bottom_right, corner));
	}
}

function square_limit(painter, n) {
	var corner = corner_split(painter, n);
	var half = beside(flip_horiz(corner), corner);
	return below(flip_vert(half), half);	
}

var f = {"origin":new Vector(30, 30), "edge1":new Vector(200, 0), "edge2":new Vector(0, 200)}; // frame定义
// 方便测试用的画图函数
function paint(painter) {
	convas.width = convas.width; // reset convas
	painter(f);
}