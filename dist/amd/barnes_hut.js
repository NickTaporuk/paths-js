(function() {
  define(['./ops'], function(O) {
    var add_body, average, body_force_on, box_width, force_on, locate, make_bodies, make_quadrant, make_root, make_tree, repulsive_forces, subdivide, walk_leaves;
    average = function(body1, body2) {
      var mass, point;
      mass = body1.mass + body2.mass;
      point = O.times(1 / mass, O.plus(O.times(body1.mass, body1.point), O.times(body2.mass, body2.point)));
      return [point, mass];
    };
    locate = function(arg, quadrants) {
      var bottom, i, left, len, q, ref, right, top, x, y;
      x = arg[0], y = arg[1];
      for (i = 0, len = quadrants.length; i < len; i++) {
        q = quadrants[i];
        ref = q.box, top = ref.top, bottom = ref.bottom, left = ref.left, right = ref.right;
        if (((left <= x && x <= right)) && ((bottom <= y && y <= top))) {
          return q;
        }
      }
    };
    make_quadrant = function(arg, arg1) {
      var a, b, bottom, halfway_h, halfway_v, left, right, top;
      top = arg.top, bottom = arg.bottom, left = arg.left, right = arg.right;
      a = arg1[0], b = arg1[1];
      halfway_v = (left + right) / 2;
      halfway_h = (top + bottom) / 2;
      return {
        box: {
          top: b ? halfway_h : top,
          bottom: b ? bottom : halfway_h,
          left: a ? halfway_v : left,
          right: a ? right : halfway_v
        }
      };
    };
    subdivide = function(arg) {
      var box;
      box = arg.box;
      return [make_quadrant(box, [0, 0]), make_quadrant(box, [1, 0]), make_quadrant(box, [0, 1]), make_quadrant(box, [1, 1])];
    };
    add_body = function(root, body) {
      var child, old_body, ref;
      if (root.body) {
        old_body = root.body;
        delete root.body;
        root.children = subdivide(root);
        add_body(root, old_body);
        return add_body(root, body);
      } else {
        if (root.children) {
          child = locate(body.point, root.children);
          ref = root.point ? average(root, body) : [body.point, body.mass], root.point = ref[0], root.mass = ref[1];
          return add_body(child, body);
        } else {
          return root.body = body;
        }
      }
    };
    make_tree = function(bodies, root) {
      var body;
      if (bodies.length === 0) {
        return root;
      } else {
        body = bodies.shift();
        add_body(root, body);
        return make_tree(bodies, root);
      }
    };
    make_bodies = function(positions) {
      var bodies, id, position;
      bodies = [];
      for (id in positions) {
        position = positions[id];
        bodies.push({
          id: id,
          point: position,
          mass: 1
        });
      }
      return bodies;
    };
    make_root = function(width, height) {
      return {
        box: {
          top: height,
          bottom: 0,
          left: 0,
          right: width
        }
      };
    };
    walk_leaves = function(tree, f) {
      var child, i, len, ref, results;
      if (tree.body) {
        return f(tree);
      } else if (tree.children) {
        ref = tree.children;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          results.push(walk_leaves(child, f));
        }
        return results;
      }
    };
    body_force_on = function(b1, b2, repulsion) {
      var d, segment;
      segment = O.minus(b1.point, b2.point);
      d = O.length(segment);
      return O.times(repulsion * b1.mass * b2.mass / (d * d * d), segment);
    };
    box_width = function(arg) {
      var bottom, left, right, top;
      top = arg.top, bottom = arg.bottom, left = arg.left, right = arg.right;
      return O.length([top - bottom, right - left]);
    };
    force_on = function(leaf, tree, repulsion, threshold) {
      var d, s;
      if (tree === leaf) {
        return [0, 0];
      } else if (tree.body) {
        return body_force_on(leaf.body, tree.body, repulsion);
      } else if (tree.point) {
        s = box_width(tree.box);
        d = O.length(O.minus(leaf.body.point, tree.point));
        if (s / d < threshold) {
          return body_force_on(leaf.body, tree, repulsion);
        } else {
          return O.sum_vectors(tree.children.map(function(c) {
            return force_on(leaf, c, repulsion, threshold);
          }));
        }
      } else {
        return [0, 0];
      }
    };
    repulsive_forces = function(tree, repulsion, threshold) {
      var forces;
      forces = {};
      walk_leaves(tree, function(leaf) {
        return forces[leaf.body.id] = force_on(leaf, tree, repulsion, threshold);
      });
      return forces;
    };
    return {
      tree: make_tree,
      bodies: make_bodies,
      root: make_root,
      forces: repulsive_forces
    };
  });

}).call(this);
