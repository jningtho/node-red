/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var should = require("should");
var sinon = require("sinon");
var helper = require("../../helper.js");
var triggerNode = require("../../../../nodes/core/core/89-trigger.js");
var RED = require("../../../../red/red.js");

describe('trigger node', function() {

    beforeEach(function(done) {
        helper.startServer(done);
    });

    afterEach(function(done) {
        helper.unload().then(function() {
            helper.stopServer(done);
        });
    });

    it("should be loaded with correct defaults", function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", "wires":[[]]}];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property('name', 'triggerNode');
            n1.should.have.property('op1', '1');
            n1.should.have.property('op2', '0');
            n1.should.have.property('op1type', 'str');
            n1.should.have.property('op2type', 'str');
            n1.should.have.property('extend', "false");
            n1.should.have.property('units', 'ms');
            n1.should.have.property('duration', 250);
            done();
        });
    });

    it("should be able to set delay in seconds", function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", units:"s", duration:"1", "wires":[[]]}];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property('duration', 1000);
            done();
        });
    });

    it("should be able to set delay in minutes", function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", units:"min", duration:"1", "wires":[[]]}];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property('duration', 60000);
            done();
        });
    });

    it("should be able to set delay in hours", function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", units:"hr", duration:"1", "wires":[[]]}];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            n1.should.have.property('duration', 3600000);
            done();
        });
    });

    it('should output 1 then 0 when triggered (default)', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", duration:"20", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", '1');
                        c+=1;
                    }
                    else {
                        msg.should.have.a.property("payload", '0');
                        done();
                    }
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {payload:null});
        });
    });

    it('should ignore any other inputs while triggered if extend is false', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", duration:"50",wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            var errored = false;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", '1');
                    }
                    else {
                        msg.should.have.a.property("payload", '0');
                    }
                    c+=1;
                }catch(err) {
                    errored = true;
                    done(err);
                }
            });
            setTimeout( function() {
                if (!errored) {
                    try {
                        c.should.equal(2);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }
            },100);
            n1.emit("input", {payload:null});
            setTimeout( function() {
                n1.emit("input", {payload:null});
            },10);
            setTimeout( function() {
                n1.emit("input", {payload:null});
            },30);
        });
    });

    it('should handle true and false as strings and delay of 0', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", op1:"true",op1type:"val",op2:"false",op2type:"val",duration:"30", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", true);
                        c+=1;
                    }
                    else {
                        msg.should.have.a.property("payload", false);
                        done();
                    }
                } catch(err) {
                    done(err);
                }
            });
            n1.emit("input", {payload:null});
        });
    });

    it('should handle multiple topics as one if not asked to handle', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", bytopic:"all", op1:"1", op2:"0", op1type:"num", op2type:"num", duration:"30", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    c += 1;
                    if (c === 1) {
                        msg.should.have.a.property("payload", 1);
                        msg.should.have.a.property("topic", "A");
                    }
                    else if (c === 2) {
                        msg.should.have.a.property("payload", 0);
                        msg.should.have.a.property("topic", "A");
                        done();
                    }
                } catch(err) {
                    done(err);
                }
            });
            n1.emit("input", {payload:1,topic:"A"});
            n1.emit("input", {payload:2,topic:"B"});
            n1.emit("input", {payload:3,topic:"C"});
        });
    });

    it('should handle multiple topics individually if asked to do so', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", bytopic:"topic", op1:"1", op2:"0", op1type:"num", op2type:"num", duration:"30", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    c += 1;
                    if (c === 1) {
                        msg.should.have.a.property("payload", 1);
                        msg.should.have.a.property("topic", "A");
                    }
                    else if (c === 2) {
                        msg.should.have.a.property("payload", 1);
                        msg.should.have.a.property("topic", "B");
                    }
                    else if (c === 3) {
                        msg.should.have.a.property("payload", 1);
                        msg.should.have.a.property("topic", "C");
                    }
                    else if (c === 4) {
                        msg.should.have.a.property("payload", 0);
                        msg.should.have.a.property("topic", "A");
                    }
                    else if (c === 5) {
                        msg.should.have.a.property("payload", 0);
                        msg.should.have.a.property("topic", "B");
                    }
                    else if (c === 6) {
                        msg.should.have.a.property("payload", 0);
                        msg.should.have.a.property("topic", "C");
                        done();
                    }
                } catch(err) {
                    done(err);
                }
            });
            n1.emit("input", {payload:1,topic:"A"});
            n1.emit("input", {payload:2,topic:"B"});
            n1.emit("input", {payload:3,topic:"C"});
        });
    });

    it('should handle multiple topics individually, and extend one, if asked to do so', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", bytopic:"topic", extend:"true", op1:"1", op2:"0", op1type:"num", op2type:"num", duration:"30", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    c += 1;
                    if (c === 1) {
                        msg.should.have.a.property("payload", 1);
                        msg.should.have.a.property("topic", "A");
                    }
                    else if (c === 2) {
                        msg.should.have.a.property("payload", 1);
                        msg.should.have.a.property("topic", "B");
                    }
                    else if (c === 3) {
                        msg.should.have.a.property("payload", 1);
                        msg.should.have.a.property("topic", "C");
                    }
                    else if (c === 4) {
                        msg.should.have.a.property("payload", 0);
                        msg.should.have.a.property("topic", "A");
                    }
                    else if (c === 5) {
                        msg.should.have.a.property("payload", 0);
                        msg.should.have.a.property("topic", "C");
                    }
                    else if (c === 6) {
                        msg.should.have.a.property("payload", 0);
                        msg.should.have.a.property("topic", "B");
                        done();
                    }
                } catch(err) {
                    done(err);
                }
            });
            n1.emit("input", {payload:1,topic:"A"});
            n1.emit("input", {payload:2,topic:"B"});
            n1.emit("input", {payload:3,topic:"C"});
            setTimeout( function() { n1.emit("input", {payload:2,topic:"B"})}, 20 );
        });
    });

    it('should be able to return things from flow and global context variables', function(done) {
        var spy = sinon.stub(RED.util, 'evaluateNodeProperty',
            function(arg1, arg2, arg3, arg4) { return arg1; }
        );
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", op1:"foo", op1type:"flow", op2:"bar", op2type:"global", duration:"20", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", "foo");
                        c+=1;
                    }
                    else {
                        msg.should.have.a.property("payload", "bar");
                        spy.restore();
                        done();
                    }
                }
                catch(err) { spy.restore(); done(err); }
            });
            n1.emit("input", {payload:null});
        });

    });

    it('should be able to not output anything on first trigger', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", op1type:"nul", op1:"true",op2:"false",op2type:"val",duration:"30", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n2.on("input", function(msg) {
                try {
                    msg.should.have.a.property("payload", false);
                    done();
                } catch(err) {
                    done(err);
                }
            });
            n1.emit("input", {payload:null});
        });
    });

    it('should be able to not output anything on second edge', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", op2type:"nul", op1:"true",op1type:"val", op2:"false", duration:"30", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    msg.should.have.a.property("payload", true);
                    c += 1;
                }
                catch(err) { done(err); }
            });
            setTimeout( function() {
                c.should.equal(1); // should only have had one output.
                done();
            },90);
            n1.emit("input", {payload:null});
        });
    });

    it('should be able to extend the delay', function(done) {
        var spy = sinon.stub(RED.util, 'evaluateNodeProperty',
            function(arg1, arg2, arg3, arg4) { return arg1; }
        );
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", extend:"true", op1type:"flow", op1:"foo",  op2:"bar", op2type:"global", duration:"100", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", "foo");
                        c += 1;
                    }
                    else {
                        msg.should.have.a.property("payload", "bar");
                        //console.log(Date.now() - ss);
                        (Date.now() - ss).should.be.greaterThan(149);
                        spy.restore();
                        done();
                    }
                }
                catch(err) { spy.restore(); done(err); }
            });
            var ss = Date.now();
            n1.emit("input", {payload:"Hello"});
            setTimeout( function() {
                n1.emit("input", {payload:null});
            },50);
        });
    });

    it('should be able to extend the delay (but with no 2nd output)', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", extend:"true", op1type:"pay", op2type:"nul", op1:"false",  op2:"true", duration:"50", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", "Hello");
                        c += 1;
                    }
                    else {
                        msg.should.have.a.property("payload", "World");
                        //console.log(Date.now() - ss);
                        (Date.now() - ss).should.be.greaterThan(70);
                        done();
                    }
                }
                catch(err) { done(err); }
            });
            var ss = Date.now();
            n1.emit("input", {payload:"Hello"});
            setTimeout( function() {
                n1.emit("input", {payload:"Error"});
            },20);
            setTimeout( function() {
                n1.emit("input", {payload:"World"});
            },80);
        });
    });

    it('should be able to extend the delay and output the 2nd payload', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", extend:"true", op1type:"nul", op2type:"payl", op1:"false", op2:"true", duration:"50", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", "Goodbye");
                        c += 1;
                    }
                    else {
                        msg.should.have.a.property("payload", "World");
                        (Date.now() - ss).should.be.greaterThan(70);
                        done();
                    }
                }
                catch(err) { done(err); }
            });
            var ss = Date.now();
            n1.emit("input", {payload:"Hello"});
            setTimeout( function() {
                n1.emit("input", {payload:"Goodbye"});
            },20);
            setTimeout( function() {
                n1.emit("input", {payload:"World"});
            },80);
        });
    });

    it('should be able output the 2nd payload', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", extend:"false", op1type:"nul", op2type:"payl", op1:"false", op2:"true", duration:"50", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", "Goodbye");
                        c += 1;
                    }
                    else {
                        msg.should.have.a.property("payload", "World");
                        (Date.now() - ss).should.be.greaterThan(70);
                        done();
                    }
                }
                catch(err) { done(err); }
            });
            var ss = Date.now();
            n1.emit("input", {payload:"Hello"});
            setTimeout( function() {
                n1.emit("input", {payload:"Goodbye"});
            },20);
            setTimeout( function() {
                n1.emit("input", {payload:"World"});
            },80);
        });
    });

    it('should be able to apply mustache templates to payloads', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", op1type:"val", op2type:"val", op1:"{{payload}}",  op2:"{{topic}}", duration:"50", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", "Hello");
                        c+=1;
                    }
                    else {
                        msg.should.have.a.property("payload", "World");
                        done();
                    }
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {payload:"Hello",topic:"World"});
        });
    });

    it('should handle string null as null', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", op1type:"val", op2type:"pay", op1:"null", op2:"null", duration:"40", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", null);
                        c+=1;
                    }
                    else {
                        msg.should.have.a.property("payload", "World");
                        done();
                    }
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {payload:"World"});
        });
    });

    it('should handle string null as null on op2', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", op1type:"val", op2type:"val", op1:"null", op2:"null", duration:"40", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    if (c === 0) {
                        msg.should.have.a.property("payload", null);
                        c+=1;
                    }
                    else {
                        msg.should.have.a.property("payload", null);
                        done();
                    }
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {payload:"null"});
        });
    });

    it('should be able to set infinite timeout, and clear timeout', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", duration:"0", extend: false, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    c += 1;
                    msg.should.have.a.property("payload", "1");
                }
                catch(err) { done(err); }
            });
            setTimeout( function() {
                if (c === 2) { done(); }
                else {
                    done(new Error("Too many messages received"));
                }
            },20);
            n1.emit("input", {payload:null});   // trigger
            n1.emit("input", {payload:null});   // blocked
            n1.emit("input", {payload:null});   // blocked
            n1.emit("input", {reset:true});     // clear the blockage
            n1.emit("input", {payload:null});   // trigger
        });
    });

    it('should be able to set infinite timeout, and clear timeout by message', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", reset:"boo", duration:"0", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    c += 1;
                    msg.should.have.a.property("payload", "1");
                }
                catch(err) { done(err); }
            });
            setTimeout( function() {
                if (c === 2) { done(); }
                else {
                    done(new Error("Too many messages received"));
                }
            },20);
            n1.emit("input", {payload:null});   // trigger
            n1.emit("input", {payload:null});   // blocked
            n1.emit("input", {payload:null});   // blocked
            n1.emit("input", {payload:"foo"});  // don't clear the blockage
            n1.emit("input", {payload:"boo"});  // clear the blockage
            n1.emit("input", {payload:null});   // trigger
        });
    });

    it('should be able to set infinite timeout, and clear timeout by boolean true', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", reset:"true", duration:"0", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    c += 1;
                    msg.should.have.a.property("payload", "1");
                }
                catch(err) { done(err); }
            });
            setTimeout( function() {
                if (c === 2) { done(); }
                else {
                    done(new Error("Too many messages received"));
                }
            },20);
            n1.emit("input", {payload:null});   // trigger
            n1.emit("input", {payload:null});   // blocked
            n1.emit("input", {payload:null});   // blocked
            n1.emit("input", {payload:false});  // don't clear the blockage
            n1.emit("input", {payload:true});  // clear the blockage
            n1.emit("input", {payload:null});   // trigger
        });
    });

    it('should be able to set infinite timeout, and clear timeout by boolean false', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", reset:"false", duration:"0", wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                try {
                    c += 1;
                    msg.should.have.a.property("payload", "1");
                }
                catch(err) { done(err); }
            });
            setTimeout( function() {
                if (c === 2) { done(); }
                else {
                    done(new Error("Too many messages received"));
                }
            },20);
            n1.emit("input", {payload:null});   // trigger
            n1.emit("input", {payload:null});   // blocked
            n1.emit("input", {payload:null});   // blocked
            n1.emit("input", {payload:"foo"});  // don't clear the blockage
            n1.emit("input", {payload:false});  // clear the blockage
            n1.emit("input", {payload:null});   // trigger
        });
    });

    it('should be able to set a repeat, and clear loop by reset', function(done) {
        var flow = [{"id":"n1", "type":"trigger", "name":"triggerNode", reset:"boo", op1:"", op1type:"pay", duration:-25, wires:[["n2"]] },
            {id:"n2", type:"helper"} ];
        helper.load(triggerNode, flow, function() {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            var c = 0;
            n2.on("input", function(msg) {
                c += 1;
                try {
                    msg.should.have.property('payload','foo');
                    msg.payload = "bar"; // try to provoke pass by reference error
                }
                catch(err) { done(err); }
            });
            n1.emit("input", {payload:"foo"});   // trigger
            n1.emit("input", {payload:"foo"});   // trigger
            setTimeout( function() {
                n1.emit("input", {reset:true});   // reset
            },90);
            setTimeout( function() {
                c.should.within(2,5);  // should send foo between 2 and 5 times.
                done();
            },180);
        });
    });

});
