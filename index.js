
var express = require('express');
var _ = require("lodash");
var bcrypt = require('bcryptjs');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var bodyParser = require('body-parser');
const PokerEvaluator = require('poker-evaluator');
var Hand = require('pokersolver').Hand;

let referralCodeGenerator = require('referral-code-generator');
const datefor = require('date-and-time');

const mysql = require('mysql');
const pool = mysql.createPool({
	host: 'containers-us-west-107.railway.app',
	user: 'root', 
	password: 'QFeBGXh9x5d4F2FmYj8a',
	database: 'railway',
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.set('port', process.env.PORT || 3100);

app.get('/', function (req, res) {
	console.log(" Client connecting....");
	res.send("Hello express");
});


var pokerClients = [];
var socketInfo = {};
var totalCards = ["Ac", "Kc", "Qc", "Jc", "Tc", "9c", "8c", "7c", "6c", "5c", "4c", "3c", "2c", "Ad", "Kd", "Qd", "Jd", "Td", "9d", "8d", "7d", "6d", "5d", "4d", "3d", "2d", "Ah", "Kh",
	"Qh", "Jh", "Th", "9h", "8h", "7h", "6h", "5h", "4h", "3h", "2h", "As", "Ks", "Qs", "Js", "Ts", "9s", "8s", "7s", "6s", "5s", "4s", "3s", "2s"];
var totalCards2 = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", '14', "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25",
	"26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51"];
/*var totalCards2 = [
	"36", "43", "48", "13", "14",
	"1", "33", "7", "8", "9",
	"20", "21",
	"2", "3", '4', "5", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25",
	"26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51"];
*/
var PLAYER_LIST = {};
var botName = ["Liam", "Noah", "William", "James", "Oliver", "Benjamin", "Lucas", "Elijah", "Mason", "Logan", "Alexander", "Ethan", "Jacob", "Michael", "Daniel", "Henry",
	"Jackson", "Sebastian", "Aiden", "Matthew", "Samuel", "David", "Joseph", "Carter", "Owen", "Wyatt", "John", "Jack", "Luke", "Jayden", "Dylan", "Grayson", "Levi",
	"Issac", "Gabriel", "Julian", "Mateo", "Anthony", "Jaxon", "Lincoln", "Joshua", "Christopher",
	"Andrew", "Theodore", "Caleb", "Ryan", "Asher", "Nathan", "Thomas", "Leo"];

app.get("/online", function (req, res) {
	res.json(clients);
});

function FindPlayerStart(cValue) {
	cValue += 1;
	for (var i in socketInfo) {
		var lSocket = socketInfo[i];
		if (lSocket.seat) {

		}
	}
}

setInterval(function () {
	for (var i in socketInfo) {
		var lSocket = socketInfo[i];
		if (lSocket.socket.adapter.rooms[lSocket.room] != undefined) {
			lSocket.socket.adapter.rooms[lSocket.room].searchOne = 0;
		}
	}
	for (var i in socketInfo) {
		var lSocket = socketInfo[i];
		var socRoom = lSocket.socket.adapter.rooms[lSocket.room];
		if (socRoom != undefined) {
			if (socRoom.play == 1 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				socRoom.waitingCount += 1;
				if (socRoom.waitingCount >= 1) {
					socRoom.waitingCount = 0;
					socRoom.play = 2;
					for (var j in socketInfo) {
						var lSocket2 = socketInfo[j];
						if (lSocket2.room == lSocket.room) {
							if ((lSocket2.seat - 1) == socRoom.smallBlind) {
								lSocket2.currBet = socRoom.startBetAmount / 2;
								lSocket2.currBet2 = socRoom.startBetAmount / 2;
								lSocket2.chips -= socRoom.startBetAmount / 2;
								socRoom.potValue += socRoom.startBetAmount / 2;
							}
							if ((lSocket2.seat - 1) == socRoom.bigBlind) {
								lSocket2.currBet = socRoom.startBetAmount;
								lSocket2.currBet2 = socRoom.startBetAmount;
								lSocket2.chips -= socRoom.startBetAmount;
								socRoom.potValue += socRoom.startBetAmount;
							}
							lSocket2.socket.emit("ChipsUpdate", {
								seat: (lSocket2.seat - 1),
								chips: lSocket2.chips
							});
						}
					}
					lSocket.socket.emit("BlindBet", {
						smallBlindseat: socRoom.smallBlind,
						bigBlindseat: socRoom.bigBlind,
						betAmount: socRoom.startBetAmount,
						dealerValue: socRoom.dealerValue
					});
					lSocket.socket.broadcast.in(lSocket.room).emit("BlindBet", {
						smallBlindseat: socRoom.smallBlind,
						bigBlindseat: socRoom.bigBlind,
						betAmount: socRoom.startBetAmount,
						dealerValue: socRoom.dealerValue
					});
				}
			} else if (socRoom.play == 2 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				if (socRoom.waitingCount == 0) {
					var shuStr = "";
					for (var k = 0; k < 52; k++) {
						var temp = totalCards2[k];
						var randomIndex = Math.floor(Math.random() * (52 - k));
						totalCards2[k] = totalCards2[randomIndex];
						totalCards2[randomIndex] = temp;
					}
					for (var k = 0; k < 52; k++) {
						var temp = totalCards2[k];
						shuStr = shuStr + temp + " ";
					}
					socRoom.shuffle = shuStr;
					lSocket.socket.emit("PassCard", {
						shuffle: shuStr
					});
					lSocket.socket.broadcast.in(lSocket.room).emit("PassCard", {
						shuffle: shuStr
					});
					let floop = [0, 1, 2, 3, 4];
					for (let i of floop) {
						if (i == 0)
							socRoom.cStr1 = totalCards[totalCards2[i + 12]];
						else if (i == 1)
							socRoom.cStr2 = totalCards[totalCards2[i + 12]];
						else if (i == 2)
							socRoom.cStr3 = totalCards[totalCards2[i + 12]];
						else if (i == 3)
							socRoom.cStr4 = totalCards[totalCards2[i + 12]];
						else if (i == 4)
							socRoom.cStr5 = totalCards[totalCards2[i + 12]];
					}
					for (var k in socketInfo) {
						var lSocket4 = socketInfo[k];
						if (lSocket4.room == lSocket.room && lSocket4.wait == 0) {
							lSocket4.carStr1 = totalCards[totalCards2[(lSocket4.seat - 1)]];
							lSocket4.carStr2 = totalCards[totalCards2[(lSocket4.seat - 1) + 5]];
							//console.log(lSocket4.carStr1 +" "+ lSocket4.carStr2);
							var eva1 = PokerEvaluator.evalHand([lSocket4.carStr1, lSocket4.carStr2, socRoom.cStr1, socRoom.cStr2, socRoom.cStr3, socRoom.cStr4, socRoom.cStr5]);
							lSocket4.eva = eva1;
							var eva2 = Hand.solve([lSocket4.carStr1, lSocket4.carStr2, socRoom.cStr1, socRoom.cStr2, socRoom.cStr3, socRoom.cStr4, socRoom.cStr5]);
							lSocket4.eva2 = eva2;
							console.log("pathu " + eva2.name + " " + eva2.descr + "   " + lSocket4.carStr1 + " " + lSocket4.carStr2);
						}
					}
				}
				socRoom.waitingCount += 1;
				if (socRoom.waitingCount >= 3) {
					socRoom.waitingCount = 0;
					socRoom.play = 3;
					lSocket.socket.emit("CardOpen", {});
					lSocket.socket.broadcast.in(lSocket.room).emit("CardOpen", {});
					round_Finished(socRoom, lSocket);
				}
			} else if (socRoom.play == 3 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				socRoom.gameTimer += 1;
				var ch5 = true;
				var fBet = 0;
				for (var k in socketInfo) {
					var lSocket2 = socketInfo[k];
					if (lSocket.room == lSocket2.room && socRoom.currPlay == (lSocket2.seat - 1) && lSocket2.bot == 1 && ch5) {
						ch5 = false;
						fBet = socRoom.maxBet - lSocket2.currBet;
						if (lSocket2.botTimerEnd == socRoom.gameTimer) {
							//console.log("df  " + socRoom.maxBet + " " + lSocket2.currBet);
							var randomIndex = Math.floor(Math.random() * 5);
							randomIndex = 3;
							if (randomIndex == 2) {
								// Fold
								lSocket2.fold = 1;
								lSocket2.socket.emit("FOLD", {
									seat: (lSocket2.seat - 1)
								});
								lSocket2.socket.broadcast.in(lSocket2.room).emit("FOLD", {
									seat: (lSocket2.seat - 1)
								});
								if (socRoom.currPlay == socRoom.round_end)
									check_lastRound(socRoom, lSocket2);
								if (Game_Finished(lSocket2) <= 1) {
									console.log("win");
									socRoom.play = 5;
								}
							} else {
								if (fBet != 0) {
									if (lSocket2.chips >= fBet) {
										var raiseRandom = Math.floor(Math.random() * 5);
										var fBet2 = fBet * 2;
										if (raiseRandom == 1) {
											if (lSocket2.chips >= fBet2)
												raiseRandom = raiseRandom;
											else
												raiseRandom = 2;
										}
										if (raiseRandom != 1) {
											//Bet
											lSocket2.chips -= fBet;
											lSocket2.currBet += fBet;
											lSocket2.currBet2 += fBet;
											socRoom.potValue += fBet;
											lSocket2.socket.emit("BET", {
												betAmount: lSocket2.currBet,
												seat: (lSocket2.seat - 1),
												chips: lSocket2.chips
											});
											lSocket2.socket.broadcast.in(lSocket2.room).emit("BET", {
												betAmount: lSocket2.currBet,
												seat: (lSocket2.seat - 1),
												chips: lSocket2.chips
											});
										} else {
											//Raise
											round_Finished(socRoom, lSocket2);
											lSocket2.chips -= fBet2;
											lSocket2.currBet += fBet2;
											lSocket2.currBet2 += fBet2;
											socRoom.maxBet = lSocket2.currBet;
											socRoom.potValue += fBet2;
											lSocket2.socket.emit("RAISE", {
												betAmount: lSocket2.currBet,
												seat: (lSocket2.seat - 1),
												chips: lSocket2.chips
											});
											lSocket2.socket.broadcast.in(lSocket2.room).emit("RAISE", {
												betAmount: lSocket2.currBet,
												seat: (lSocket2.seat - 1),
												chips: lSocket2.chips
											});
										}

										if (socRoom.currPlay == socRoom.round_end)
											check_lastRound(socRoom, lSocket2);
									} else {
										//All IN
										lSocket2.allin = 1;
										lSocket2.currBet += lSocket2.chips;
										lSocket2.currBet2 += lSocket2.chips;
										socRoom.potValue += lSocket2.chips;
										lSocket2.chips = 0;
										lSocket2.chips = 0;
										lSocket2.socket.emit("ALLIN", {
											betAmount: lSocket2.currBet,
											seat: (lSocket2.seat - 1),
											chips: lSocket2.chips
										});
										lSocket2.socket.broadcast.in(lSocket2.room).emit("ALLIN", {
											betAmount: lSocket2.currBet,
											seat: (lSocket2.seat - 1),
											chips: lSocket2.chips
										});
										if (socRoom.currPlay == socRoom.round_end)
											check_lastRound(socRoom, lSocket2);

										if (Game_Finished(lSocket2) <= 1) {
											console.log("win2");
											socRoom.play = 5;
										}
									}
								} else {
									//round_end
									if (Find_Check(lSocket2) == 0) {
										//Check
										if (socRoom.currPlay == socRoom.round_end) {
											lSocket2.socket.emit("CHECK", {
												seat: (lSocket2.seat - 1)
											});
											lSocket2.socket.broadcast.in(lSocket2.room).emit("CHECK", {
												seat: (lSocket2.seat - 1)
											});
											check_lastRound(socRoom, lSocket2);
										} else {
											lSocket2.socket.emit("CHECK", {
												seat: (lSocket2.seat - 1)
											});
											lSocket2.socket.broadcast.in(lSocket2.room).emit("CHECK", {
												seat: (lSocket2.seat - 1)
											});
										}
									}
								}
							}
							if (!socRoom.centerCardOpenChe && Game_Finished(lSocket2) > 1) {
								Find_NextPlayer(socRoom, lSocket2);
							}
							socRoom.gameTimer = 0;
						}

						if (socRoom.gameTimer == 1) {
							lSocket2.socket.emit("StartPlay", { currPlay: socRoom.currPlay, maxBet: fBet, chips: lSocket2.chips });
							//lSocket.socket.broadcast.in(lSocket.room).emit("StartPlay", { currPlay: socRoom.currPlay, maxBet: fBet, chips: lSocket2.chips });
						}
					} else if (lSocket.room == lSocket2.room && socRoom.currPlay == (lSocket2.seat - 1) && lSocket2.bot == 0 && ch5) {
						ch5 = false;
						fBet = socRoom.maxBet - lSocket2.currBet;
						if (socRoom.gameTimer == 1) {
							lSocket2.socket.emit("StartPlay", {
								currPlay: socRoom.currPlay, maxBet: fBet, chips: lSocket2.chips,
								startBetAmount: socRoom.startBetAmount,
								currBet: lSocket2.currBet
							});
							/*lSocket.socket.broadcast.in(lSocket.room).emit("StartPlay", {
								currPlay: socRoom.currPlay, maxBet: fBet, chips: lSocket2.chips,
								startBetAmount: socRoom.startBetAmount,
								currBet: lSocket2.currBet
							});*/
						}
						//Timer End
						if (socRoom.gameTimer > 25) {
							lSocket2.fold = 1;
							lSocket2.socket.emit("FOLD", {
								seat: (lSocket2.seat - 1)
							});
							lSocket2.socket.broadcast.in(lSocket2.room).emit("FOLD", {
								seat: (lSocket2.seat - 1)
							});
							if (Game_Finished(lSocket2) <= 1) {
								console.log("win");
								socRoom.play = 5;
							}
							Find_NextPlayer(socRoom, lSocket2);
							socRoom.gameTimer = 0;
						}
					}
				}
				lSocket.socket.emit("CurrPlay", { timer: socRoom.gameTimer, currPlay: socRoom.currPlay });
				lSocket.socket.broadcast.in(lSocket.room).emit("CurrPlay", { timer: socRoom.gameTimer, currPlay: socRoom.currPlay });

			} else if (socRoom.play == 4 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				socRoom.waitingCount += 1;
				if (socRoom.waitingCount >= 2) {
					socRoom.waitingCount = 0;
					socRoom.play = 3;
					socRoom.maxBet = 0;
					socRoom.centerCardOpenChe = false;
					SetCurrBet(lSocket);
					Find_NextPlayer(socRoom, lSocket);
					round_Finished(socRoom, lSocket);
				}
			} else if (socRoom.play == 5 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				if (socRoom.waitingCount == 0) {
					lSocket.socket.emit("WIN", {});
					lSocket.socket.broadcast.in(lSocket.room).emit("WIN", {});
					for (var k = socRoom.centerCardValue; k < 3; k++) {
						check_lastRound2(socRoom, lSocket);
					}
					//All Process
					var allinData = [];
					for (var k in socketInfo) {
						var lSocket4 = socketInfo[k];
						if (lSocket4.room == lSocket.room && lSocket4.allin == 1) {
							allinData.push(lSocket4);
						}
					}
					for (var k = 0; k < allinData.length; k++) {
						//console.log("coco " + allinData.length + " " +allinData[k].eva.value+" "+allinData[k].currBet2 );
						for (var j = k + 1; j < allinData.length; j++) {
							if (allinData[j].currBet2 < allinData[k].currBet2) {
								var tmp = allinData[k];
								allinData[k] = allinData[j];
								allinData[j] = tmp;
							}
						}
					}
					for (var k = 0; k < allinData.length; k++) {
						//console.log("ggg " + allinData[k].currBet2);
					}

					//All In Calculated -------------------------------------------------------------------

					for (var k = 0; k < allinData.length; k++) {
						//console.log("coco2 " + allinData[k].eva.value);
						var findData = [];
						var lCurBet = 0;
						var lCurBet2 = allinData[k].currBet2;
						var foldValue = 0;
						var chPlayer = 0;
						console.log("kk " + lCurBet2 + " " + (allinData[k].currBet2));
						for (var j in socketInfo) {
							var lSocket4 = socketInfo[j];
							if (lSocket4.room == lSocket.room && lSocket4.fold == 0 && lSocket4.allin != 2 && lSocket4.wait == 0) {
								if (lSocket4 == allinData[k])
									lSocket4.allin = 2;
								if (lSocket4.currBet2 >= lCurBet2) {
									lCurBet += lCurBet2;
									lSocket4.currBet2 -= lCurBet2;
									findData.push(lSocket4);
								}
							}
							if (lSocket4.room == lSocket.room && lSocket4.allin == 0 && lSocket4.fold == 0 && lSocket4.wait == 0)
								chPlayer += 1;

						}
						for (var m = 0; m < findData.length; m++) {
							for (var n = m + 1; n < findData.length; n++) {
								if (findData[n].eva.value > findData[m].eva.value) {
									var tmp = findData[m];
									findData[m] = findData[n];
									findData[n] = tmp;
								}
							}
						}
						var resData = [];
						resData.push(findData[0]);
						if (chPlayer == 0 && (k + 1) == allinData.length) {
							for (var j in socketInfo) {
								var lSocket4 = socketInfo[j];
								if (lSocket4.room == lSocket.room && lSocket4.fold == 1) {
									foldValue += lSocket4.currBet2;
									lSocket4.currBet2 = 0;
								}
							}
							lCurBet += foldValue;
						}
						for (var m = 0; m < findData.length; m++) {
							if (findData[0].eva.value == findData[m].eva.value && m != 0)
								resData.push(findData[m]);
							console.log("wel " + findData[m].eva.value + " " + (findData[m].seat - 1));
						}
						// Last win
						for (var m = 0; m < resData.length; m++) {
							console.log("AllIN Win " + (resData[m].seat - 1) + " " + lCurBet / (resData.length));
							for (var j in socketInfo) {
								var lSocket4 = socketInfo[j];
								if (lSocket4.room == resData[m].room && (resData[m].seat - 1) == (lSocket4.seat - 1)) {
									lSocket4.chips += (lCurBet / (resData.length));
									console.log(lSocket4.eva2.descr);
									if (lSocket4.eva2.name == "Royal Flush") {
										var bChips = lSocket4.bjp;
										bChips = bChips / 100;
										bChips = bChips * 70;
										lSocket4.bjp -= bChips;
										lSocket4.chips += bChips;
										writeHandReward(lSocket4.id, "Royal Flush");
									} else if (lSocket4.eva2.name == "Straight Flush") {
										var bChips = lSocket4.jp;
										bChips = bChips / 100;
										bChips = bChips * 75;
										lSocket4.jp -= bChips;
										lSocket4.chips += bChips;
										writeHandReward(lSocket4.id, "Straight Flush");
									} else if (lSocket4.eva2.name == "Four of a Kind") {
										var bChips = lSocket4.jp;
										bChips = bChips / 100;
										bChips = bChips * 50;
										lSocket4.jp -= bChips;
										lSocket4.chips += bChips;
										writeHandReward(lSocket4.id, "Four of a Kind");
									}

									lSocket4.socket.emit("ChipsShare", {
										seat: (resData[m].seat - 1),
										winValue: (lCurBet / (resData.length)),
										chips: lSocket4.chips,
										handName: resData[m].eva.handName,
										strDes: lSocket4.eva2.descr,
										strName: lSocket4.eva2.name,
										bjp: lSocket4.bjp,
										jp: lSocket4.jp
									});
									lSocket4.socket.broadcast.in(lSocket4.room).emit("ChipsShare", {
										seat: (resData[m].seat - 1),
										winValue: (lCurBet / (resData.length)),
										chips: lSocket4.chips,
										handName: resData[m].eva.handName,
										strDes: lSocket4.eva2.descr,
										strName: lSocket4.eva2.name,
										bjp: lSocket4.bjp,
										jp: lSocket4.jp
									});
								} else if (lSocket4.room == resData[m].room) {
									lSocket4.socket.emit("ChipsShareLoss", {
										seat: (lSocket4.seat - 1)
									});
								}
							}
						}
					}

					var rCount = 0;
					var rCount2 = 0;
					var winValue = 0;
					for (var k in socketInfo) {
						var lSocket4 = socketInfo[k];
						if (lSocket4.fold == 0 && lSocket4.allin == 0 && lSocket4.wait == 0) {
							rCount += 1;
							winValue = (lSocket4.seat - 1);
						}
						if (lSocket4.fold == 1)
							rCount2 += lSocket4.currBet2;
					}

					if (rCount == 1) {
						for (var k in socketInfo) {
							var lSocket4 = socketInfo[k];
							if ((lSocket4.seat - 1) == winValue) {
								console.log("Win for1 " + rCount2 + " " + lSocket4.currBet2);
								rCount2 += lSocket4.currBet2;
								lSocket4.chips += rCount2;
								lSocket4.socket.emit("ChipsShare2", {
									seat: (lSocket4.seat - 1),
									winValue: rCount2,
									chips: lSocket4.chips,
								});
								lSocket4.socket.broadcast.in(lSocket4.room).emit("ChipsShare2", {
									seat: (lSocket4.seat - 1),
									winValue: rCount2,
									chips: lSocket4.chips,
								});

							}
						}
					}
					if (rCount >= 2) {
						//Normal Calculated -------------------------------------------------------------------
						var findData2 = [];
						var lCurBet2 = 0;
						for (var j in socketInfo) {
							var lSocket4 = socketInfo[j];
							if (lSocket4.room == lSocket.room && lSocket4.fold == 0 && lSocket4.allin == 0 && lSocket4.wait == 0) {
								findData2.push(lSocket4);
							}
							if (lSocket4.room == lSocket.room && lSocket4.allin == 0 && lSocket4.wait == 0)
								lCurBet2 += lSocket4.currBet2;

						}
						for (var m = 0; m < findData2.length; m++) {
							for (var n = m + 1; n < findData2.length; n++) {
								if (findData2[n].eva.value > findData2[m].eva.value) {
									var tmp = findData2[m];
									findData2[m] = findData2[n];
									findData2[n] = tmp;
								}
							}
						}
						for (var m = 0; m < findData2.length; m++) {
							console.log("wel2 " + findData2[m].eva.value + " " + (findData2[m].seat - 1));
						}
						var resData2 = [];
						resData2.push(findData2[0]);
						for (var m = 0; m < findData2.length; m++) {
							if (findData2[0].eva.value == findData2[m].eva.value && m != 0)
								resData2.push(findData2[m]);
						}
						for (var m = 0; m < resData2.length; m++) {
							console.log("Final Win " + (resData2[m].seat - 1) + " " + lCurBet2 / (resData2.length));
							for (var j in socketInfo) {
								var lSocket4 = socketInfo[j];
								if (lSocket4.room == resData2[m].room && (resData2[m].seat - 1) == (lSocket4.seat - 1)) {
									lSocket4.chips += (lCurBet2 / (resData2.length));
									console.log(lSocket4.eva2.descr);
									if (lSocket4.eva2.name == "Royal Flush") {
										var bChips = lSocket4.bjp;
										bChips = bChips / 100;
										bChips = bChips * 70;
										lSocket4.chips += bChips;
										lSocket4.bjp -= bChips;
										writeHandReward(lSocket4.id, "Royal Flush");
									} else if (lSocket4.eva2.name == "Straight Flush") {
										var bChips = lSocket4.jp;
										bChips = bChips / 100;
										bChips = bChips * 75;
										lSocket4.jp -= bChips;
										lSocket4.chips += bChips;
										writeHandReward(lSocket4.id, "Straight Flush");
									} else if (lSocket4.eva2.name == "Four of a Kind") {
										var bChips = lSocket4.jp;
										bChips = bChips / 100;
										bChips = bChips * 50;
										lSocket4.jp -= bChips;
										lSocket4.chips += bChips;
										writeHandReward(lSocket4.id, "Four of a Kind");
									}

									lSocket4.socket.emit("ChipsShare", {
										seat: (resData2[m].seat - 1),
										winValue: (lCurBet2 / (resData2.length)),
										chips: lSocket4.chips,
										handName: resData2[m].eva.handName,
										strDes: lSocket4.eva2.descr,
										strName: lSocket4.eva2.name,
										bjp: lSocket4.bjp,
										jp: lSocket4.jp
									});
									lSocket4.socket.broadcast.in(lSocket4.room).emit("ChipsShare", {
										seat: (resData2[m].seat - 1),
										winValue: (lCurBet2 / (resData2.length)),
										chips: lSocket4.chips,
										handName: resData2[m].eva.handName,
										strDes: lSocket4.eva2.descr,
										strName: lSocket4.eva2.name,
										bjp: lSocket4.bjp,
										jp: lSocket4.jp
									});
								} else if (lSocket4.room == resData2[m].room) {
									lSocket4.socket.emit("ChipsShareLoss", {
										seat: (lSocket4.seat - 1)

									});
								}
							}
						}
					}
				}

				if (socRoom.waitingCount == 1) {
					lSocket.socket.emit("StartWinShare", {});
					lSocket.socket.broadcast.in(lSocket.room).emit("StartWinShare", {});
				}

				socRoom.waitingCount += 1;
				if (socRoom.waitingCount >= 30) {
					socRoom.waitingCount = 0;
					socRoom.play = 6;
					lSocket.socket.emit("Reset", {});
					lSocket.socket.broadcast.in(lSocket.room).emit("Reset", {});
					var vBot = 0;
					if (socRoom.length == 2 && Player_Count(lSocket) == 4)
						vBot = 1;
					else if (socRoom.length >= 3)
						vBot = 2;
					for (var j in socketInfo) {
						var lSocket4 = socketInfo[j];
						if (lSocket4.bot == 1 && vBot >= 1 && lSocket4.room == lSocket.room) {
							vBot -= 1;
							delete socketInfo[lSocket4.localSocketId];
						}
					}
					var fSocket;
					for (var j in socketInfo) {
						var lSocket4 = socketInfo[j];
						if (lSocket4.chips < socRoom.startBetAmount && lSocket4.bot == 0 && lSocket4.room == lSocket.room) {
							fSocket = lSocket4.socket;
							lSocket4.socket.emit("NoChipsRemove", {});
							lSocket4.socket.leave(lSocket4.room);
							delete socketInfo[lSocket4.localSocketId];
						} else if (lSocket4.chips < socRoom.startBetAmount && lSocket4.bot == 1 && lSocket4.room == lSocket.room) {
							//lSocket4.socket.leave(lSocket4.room);
							delete socketInfo[lSocket4.localSocketId];
						}

					}
					if (fSocket != undefined) {
						for (var j in socketInfo) {
							var lSocket4 = socketInfo[j];
							if (lSocket4.socket == fSocket && lSocket4.bot == 1) {
								delete socketInfo[lSocket4.localSocketId];
							}
						}
					}
					console.log("bb " + socRoom.length + " " + Player_Count(lSocket));
					if (socRoom.length == 1 || socRoom.length == 0) {
						if (Player_Count(lSocket) == 1) {
							createBot(lSocket, 1);
							createBot(lSocket, 2);
						} else if (Player_Count(lSocket) == 2) {
							var chValue = true;
							for (var j in socketInfo) {
								var lSocket4 = socketInfo[j];
								if (lSocket4.room == lSocket.room && lSocket4.botj == 1) {
									chValue = false;
								}
							}
							createBot(lSocket, (chValue ? 1 : 2));
						}
					} else if (socRoom.length == 2) {
						if (Player_Count(lSocket) == 2) {
							var chValue = true;
							for (var j in socketInfo) {
								var lSocket4 = socketInfo[j];
								if (lSocket4.room == lSocket.room && lSocket4.botj == 1) {
									chValue = false;
								}
							}
							createBot(lSocket, (chValue ? 1 : 2));
						}
					}
					for (var j in socketInfo) {
						var lSocket4 = socketInfo[j];
						if (lSocket4.room == lSocket.room) {
							if (lSocket4.chips < socRoom.startBetAmount && lSocket4.bot == 1) {
								var rIndex = Math.floor(Math.random() * botName.length);
								lSocket4.name = botName[rIndex];
								var rIndex2 = Math.floor(Math.random() * 10);
								lSocket4.chips = parseInt((socRoom.startBetAmount * 40) + (rIndex2 * 100));
							}
							lSocket4.currBet = 0;
							lSocket4.currBet2 = 0;
							lSocket4.fold = 0;
							lSocket4.allin = 0;
							lSocket4.botTimerEnd = 0;
							lSocket4.cardStr1 = "";
							lSocket4.cardStr2 = "";
							lSocket4.wait = 0;
							lSocket4.socket.emit("PlayerJoin", {
								seat: (lSocket4.seat - 1),
								avatar: lSocket4.avatar,
								avatarStr: lSocket4.avatarStr,
								name: lSocket4.name,
								chips: lSocket4.chips,
								bot: lSocket4.bot,
								wait: lSocket4.wait
							});
							lSocket4.socket.broadcast.in(lSocket4.room).emit("PlayerJoin", {
								seat: (lSocket4.seat - 1),
								avatar: lSocket4.avatar,
								avatarStr: lSocket4.avatarStr,
								name: lSocket4.name,
								chips: lSocket4.chips,
								bot: lSocket4.bot,
								wait: lSocket4.wait
							});
						}
					}
					socRoom.dealerValue = Find_Persion(lSocket, socRoom.dealerValue);
					socRoom.smallBlind = Find_Persion(lSocket, socRoom.dealerValue);
					socRoom.bigBlind = Find_Persion(lSocket, socRoom.smallBlind);
					socRoom.currPlay = socRoom.bigBlind;
					Find_NextPlayer(socRoom, lSocket);
					socRoom.searchOne = 0;
					socRoom.play = 0;
					socRoom.waitingCount = 0;
					socRoom.maxBet = socRoom.startBetAmount;
					socRoom.shuffle = "";
					socRoom.gameTimer = 0;
					socRoom.centerCardValue = 0;
					socRoom.round_end = 0;
					socRoom.centerCardOpenChe = false;
					socRoom.potValue = 0;
					socRoom.cStr1 = "";
					socRoom.cStr2 = "";
					socRoom.cStr3 = "";
					socRoom.cStr4 = "";
					socRoom.cStr5 = "";


					if (Player_Count(lSocket) >= 3)
						socRoom.play = 1;

				}
			}
		}
	}

	//Remove Player
	for (var k in socketInfo) {
		var lSocket = socketInfo[k];
		var socRoom = lSocket.socket.adapter.rooms[lSocket.room];
		//console.log("inimel "+lSocket.seat);
		if (socRoom != undefined) {
			if (socRoom.play >= 3 && lSocket.removePlayer == 1) {
				lSocket.fold = 1;
				lSocket.socket.emit("FOLD", {
					seat: (lSocket.seat - 1)
				});
				lSocket.socket.broadcast.in(lSocket.room).emit("FOLD", {
					seat: (lSocket.seat - 1)
				});
				Find_NextPlayer(socRoom, lSocket);
				socRoom.gameTimer = 0;
				if (Game_Finished(lSocket) <= 1) {
					console.log("win");
					socRoom.play = 5;
				}
				console.log("Deleted " + lSocket.localSocketId);
				delete socketInfo[lSocket.localSocketId];
			}
		} else {
			delete socketInfo[lSocket.localSocketId];
		}
	}
}, 700);


function Find_NextPlayer(socRoom, lSocket2) {
	var localCPlay = socRoom.currPlay;
	var eChe = true;
	var releaseCount = 0;
	while (eChe) {
		socRoom.currPlay += 1;
		if (socRoom.currPlay >= 5)
			socRoom.currPlay = 0;
		for (var k in socketInfo) {
			var lSocket4 = socketInfo[k];
			//console.log("cc " + socRoom.curPlyValue + " " + (lSocket4.seat - 1));
			if (socRoom.currPlay == (lSocket4.seat - 1) && lSocket4.fold == 0 && lSocket4.allin == 0 && lSocket2.room == lSocket4.room &&
				localCPlay != socRoom.currPlay && lSocket4.wait == 0)
				eChe = false;
		}
		releaseCount += 1;
		if (releaseCount >= 7)
			eChe = false;
	}

	console.log("nne " + socRoom.currPlay + " " + socRoom.centerCardValue);
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		//console.log("cc " + socRoom.curPlyValue + " " + (lSocket4.seat - 1));
		if (socRoom.currPlay == (lSocket4.seat - 1) && lSocket4.bot == 1) {
			var randomIndex = Math.floor(Math.random() * 7);
			lSocket4.botTimerEnd = 2 + randomIndex;
		}
	}
	var eValue = 0;
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		if (socRoom.currPlay == (lSocket4.seat - 1)) {
			eValue = 1;
		}
	}
	if (eValue == 0) {
		socRoom.centerCardOpenChe = true;
		socRoom.play = 5;
	}


}
function Find_Persion(lSocket2, playNow) {
	var localCPlay = playNow;
	var eChe = true;
	var releaseCount = 0;
	while (eChe) {
		playNow += 1;
		if (playNow >= 6)
			playNow = 0;
		for (var k in socketInfo) {
			var lSocket4 = socketInfo[k];
			if (playNow == (lSocket4.seat - 1) && lSocket2.room == lSocket4.room && localCPlay != playNow)
				eChe = false;
		}
		releaseCount += 1;
		if (releaseCount >= 7)
			eChe = false;
	}
	return playNow;
}
function Find_Check(lSocket2) {
	var tPlayer = 0;
	var equalPlayer = 0;
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		if (lSocket2.room == lSocket4.room && lSocket4.fold == 0 && lSocket4.allin == 0 && lSocket4.wait == 0) {
			tPlayer += 1;
			if (lSocket2.currBet == lSocket4.currBet) {
				equalPlayer += 1;
			}
		}
	}
	return tPlayer - equalPlayer;
}
function SetCurrBet(lSocket2) {
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		if (lSocket2.room == lSocket4.room)
			lSocket4.currBet = 0;
	}
}
function round_Finished(socRoom, lSocket2) {
	var localCPlay = socRoom.currPlay;
	var localCPlay2 = socRoom.currPlay;
	var eChe = true;
	var releaseCount = 0;
	while (eChe) {
		localCPlay2 -= 1;
		if (localCPlay2 < 0)
			localCPlay2 = 5;
		for (var k in socketInfo) {
			var lSocket4 = socketInfo[k];
			//console.log("cc " + socRoom.curPlyValue + " " + (lSocket4.seat - 1));
			if (localCPlay2 == (lSocket4.seat - 1) && lSocket4.fold == 0 && lSocket4.allin == 0 && lSocket2.room == lSocket4.room &&
				localCPlay != localCPlay2 && lSocket4.wait == 0)
				eChe = false;
		}
		releaseCount += 1;
		if (releaseCount >= 7)
			eChe = false;
	}
	socRoom.round_end = localCPlay2;
}

function check_lastRound(socRoom, lSocket) {
	if (socRoom.currPlay == socRoom.round_end) {
		if (socRoom.centerCardValue <= 2) {
			socRoom.centerCardOpenChe = true;
			socRoom.play = 4;
			socRoom.centerCardValue += 1;
			lSocket.socket.emit("CenterCardOpen", {
				centerCardValue: socRoom.centerCardValue,
				seat: (lSocket.seat - 1),
				potValue: socRoom.potValue
			});
			lSocket.socket.broadcast.in(lSocket.room).emit("CenterCardOpen", {
				centerCardValue: socRoom.centerCardValue,
				seat: (lSocket.seat - 1),
				potValue: socRoom.potValue
			});
		} else {
			console.log("win");
			socRoom.centerCardOpenChe = true;
			socRoom.play = 5;
		}
	}
}
function check_lastRound2(socRoom, lSocket) {
	if (socRoom.centerCardValue <= 2) {
		socRoom.centerCardOpenChe = true;
		socRoom.centerCardValue += 1;
		lSocket.socket.emit("CenterCardOpen", {
			centerCardValue: socRoom.centerCardValue,
			seat: (lSocket.seat - 1),
			potValue: socRoom.potValue
		});
		lSocket.socket.broadcast.in(lSocket.room).emit("CenterCardOpen", {
			centerCardValue: socRoom.centerCardValue,
			seat: (lSocket.seat - 1),
			potValue: socRoom.potValue
		});
	}
}
function Game_Finished(lSocket) {
	var reCount = 0;
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		//console.log("cc " + socRoom.curPlyValue + " " + (lSocket4.seat - 1));
		if (lSocket.room == lSocket4.room && lSocket4.fold == 0 && lSocket4.wait == 0)
			reCount += 1;
	}
	return reCount;
}
function Player_Count(lSocket) {
	var reCount = 0;
	for (var k in socketInfo) {
		var lSocket4 = socketInfo[k];
		if (lSocket.room == lSocket4.room)
			reCount += 1;
	}
	return reCount;
}
function createBot(lSocket, j) {
	var socId = lSocket.socket.id;
	if (j == 1 || j == 2)
		socId = lSocket.socket.id + j;
	socketInfo[socId] = [];
	socketInfo[socId].socket = lSocket.socket;
	var rIndex = Math.floor(Math.random() * botName.length);
	socketInfo[socId].name = botName[rIndex];
	var rIndex2 = Math.floor(Math.random() * 50);
	socketInfo[socId].chips = parseInt(20000 + (rIndex2 * 100));
	socketInfo[socId].room = lSocket.room;
	socketInfo[socId].localSocketId = socId;
	socketInfo[socId].botj = j;
	socketInfo[socId].currBet = 0;
	socketInfo[socId].currBet2 = 0;
	socketInfo[socId].fold = 0;
	socketInfo[socId].allin = 0;
	socketInfo[socId].botTimerEnd = 0;
	socketInfo[socId].bot = 1;
	socketInfo[socId].cardStr1 = "";
	socketInfo[socId].cardStr2 = "";
	socketInfo[socId].wait = 0;
	socketInfo[socId].removePlayer = 0;

	var ch2 = true;
	let floop = [1, 2, 3, 4, 5, 6];
	for (let i of floop) {
		if (ch2) {
			var seatAvailable = false;
			for (var k in socketInfo) {
				var lSocket4 = socketInfo[k];
				if (i == lSocket4.seat && lSocket.room == lSocket4.room)
					seatAvailable = true;
			}
			if (!seatAvailable) {
				ch2 = false;
				socketInfo[socId].seat = i;
			}
		}
	}
	ch2 = true;
	floop = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
		20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49];
	floop = floop.sort(() => Math.random() - 0.5);
	for (let i of floop) {
		if (ch2) {
			var seatAvailable = false;
			for (var k in socketInfo) {
				var lSocket = socketInfo[k];
				if (i == lSocket.avatar && data.room == lSocket.room)
					seatAvailable = true;
			}
			if (!seatAvailable) {
				ch2 = false;
				socketInfo[socId].avatar = i;
			}
		}
	}
}
io.on('connection', function (socket) {
	//var stt = "As";
	//var eva = PokerEvaluator.evalHand([stt, 'Ks', 'Qs', 'Js', 'Ts', '3c', '5h']);
	//console.log(eva);

	//var hand1 = Hand.solve(['4h', '4c', '4s', '4d', '9h', '2c', '3d']);
	//console.log("pala " + hand1.descr);
	//console.log("pala " + hand1.name);

	console.log("server connected");
	socket.on("StartGame", function () {
		socket.emit("Server_Started", {});
	});
	socket.on("CheckSeatRoom", function (data) {
		//socket.emit("CheckSeatRoom", {});
		var empty = 0;
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			if (lSocket2.room == data.room) {
				socket.emit("CheckSeatRoom", {
					seat: (lSocket2.seat - 1),
					avatar: lSocket2.avatar,
					avatarStr: lSocket2.avatarStr,
					name: lSocket2.name,
					chips: lSocket2.chips,
					bot: lSocket2.bot,
					wait: lSocket2.wait,
					status: "yes"
				});
				empty = 1;
			}
		}
		if (empty == 0) {
			socket.emit("CheckSeatRoom", {
				status: "no"
			});
		}
	});
	socket.on("Room", function (data) {
		var alreadyPlay = false;
		if (alreadyPlay) {
			socket.emit("AlreadyPlay", {});
		} else {
			var ch2 = true;
			var i = parseInt(data.room);
			var roomSocket = io.sockets.adapter.rooms[i + ""];
			if (roomSocket == undefined) {
				socket.join(i + "");
				socket.emit("RoomConnected", { room: parseInt(i + "") });
				[3, 4, 2, 5, 1, 6];
				socket.adapter.rooms[i + ""].dealerValue = 0;
				socket.adapter.rooms[i + ""].smallBlind = 1;
				socket.adapter.rooms[i + ""].bigBlind = 2;
				socket.adapter.rooms[i + ""].currPlay = 0;
				socket.adapter.rooms[i + ""].play = 0;
				socket.adapter.rooms[i + ""].searchOne = 0;
				socket.adapter.rooms[i + ""].waitingCount = 0;
				console.log("kadavi " + data.startBet);
				socket.adapter.rooms[i + ""].startBetAmount = parseInt(data.startBet);
				socket.adapter.rooms[i + ""].maxBet = socket.adapter.rooms[i + ""].startBetAmount;
				socket.adapter.rooms[i + ""].shuffle = "";
				socket.adapter.rooms[i + ""].gameTimer = 0;
				socket.adapter.rooms[i + ""].centerCardValue = 0;
				socket.adapter.rooms[i + ""].round_end = 0;
				socket.adapter.rooms[i + ""].centerCardOpenChe = false;
				socket.adapter.rooms[i + ""].potValue = 0;
				socket.adapter.rooms[i + ""].cStr1 = "";
				socket.adapter.rooms[i + ""].cStr2 = "";
				socket.adapter.rooms[i + ""].cStr3 = "";
				socket.adapter.rooms[i + ""].cStr4 = "";
				socket.adapter.rooms[i + ""].cStr5 = "";
				ch2 = false;
			} else {
				if (roomSocket.length < 5) {
					socket.join(i + "");
					socket.emit("RoomConnected", { room: parseInt(i) });
					ch2 = false;
				}
				console.log("ll " + roomSocket.length);
			}


		}
	});

	socket.on('SendMsg', function (data) {

		socket.emit("RecieveMsg", {
			name: data.name,
			message: data.message,
			room: parseInt(parseInt(data.room) + "")
		});
        socket.broadcast.in(data.room).emit("RecieveMsg", {
			name: data.name,
			message: data.message,
			room: parseInt(parseInt(data.room) + "")
		});

        var chat = data.name+" : "+data.message;
		console.log(chat+" Room:"+parseInt(parseInt(data.room) + ""));
	});

	socket.on("PlayerJoin", function (data) {
		var soRoom = socket.adapter.rooms[data.room];
		var len = 1;
		if (soRoom.length == 1)
			len = 3;
		else if (soRoom.length >= 2)
			len = 1;

		for (var j = 0; j < len; j++) {
			var socId;
			if (j == 0)
				socId = socket.id;
			else if (j == 1 || j == 2)
				socId = socket.id + j;
			socketInfo[socId] = [];
			socketInfo[socId].socket = socket;
			if (j != 0) {
				var rIndex = Math.floor(Math.random() * botName.length);
				socketInfo[socId].name = botName[rIndex];
				var rIndex2 = Math.floor(Math.random() * 10);
				socketInfo[socId].chips = parseInt((parseInt(data.chips) / 2) + (rIndex2 * 100));
			} else {
				socketInfo[socId].name = data.name;
				socketInfo[socId].chips = parseInt(data.chips);
			}
			socketInfo[socId].room = data.room;
			socketInfo[socId].localSocketId = socId;
			socketInfo[socId].botj = j;
			socketInfo[socId].currBet = 0;
			socketInfo[socId].currBet2 = 0;
			socketInfo[socId].fold = 0;
			socketInfo[socId].allin = 0;
			socketInfo[socId].botTimerEnd = 0;
			socketInfo[socId].bot = (j == 0 ? 0 : 1);
			socketInfo[socId].cardStr1 = "";
			socketInfo[socId].cardStr2 = "";
			socketInfo[socId].removePlayer = 0;
			socketInfo[socId].bjp = parseInt(data.bjp);
			socketInfo[socId].jp = parseInt(data.jp);
			socketInfo[socId].avatarStr = data.avatarStr;
			socketInfo[socId].level = parseInt(data.level);
			socketInfo[socId].vip = data.vip;
			socketInfo[socId].id = parseInt(data.id);
			if (soRoom.play >= 1)
				socketInfo[socId].wait = 1;
			else
				socketInfo[socId].wait = 0;

			var ch2 = true;
			let floop = [1, 2, 3, 4, 5];
			//let floop = [3, 4, 2, 5, 1];
			for (let i of floop) {
				if (ch2) {
					var seatAvailable = false;
					for (var k in socketInfo) {
						var lSocket = socketInfo[k];
						if (i == lSocket.seat && data.room == lSocket.room)
							seatAvailable = true;
					}
					if (!seatAvailable) {
						ch2 = false;
						socketInfo[socId].seat = i;
					}
				}
			}
			ch2 = true;
			floop = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
				20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49];
			floop = floop.sort(() => Math.random() - 0.5);
			for (let i of floop) {
				if (ch2) {
					var seatAvailable = false;
					for (var k in socketInfo) {
						var lSocket = socketInfo[k];
						if (i == lSocket.avatar && data.room == lSocket.room)
							seatAvailable = true;
					}
					if (!seatAvailable) {
						ch2 = false;
						socketInfo[socId].avatar = i;
					}
				}
			}
			console.log(socketInfo[socId].avatar);
			socket.emit("PlayerJoin", {
				seat: (socketInfo[socId].seat - 1),
				avatar: socketInfo[socId].avatar,
				avatarStr: socketInfo[socId].avatarStr,
				name: socketInfo[socId].name,
				chips: socketInfo[socId].chips,
				bot: socketInfo[socId].bot,
				wait: socketInfo[socId].wait

			});
			socket.broadcast.in(data.room).emit("PlayerJoin", {
				seat: (socketInfo[socId].seat - 1),
				avatar: socketInfo[socId].avatar,
				avatarStr: socketInfo[socId].avatarStr,
				name: socketInfo[socId].name,
				chips: socketInfo[socId].chips,
				bot: socketInfo[socId].bot,
				wait: socketInfo[socId].wait
			});
		}
		socket.emit("YOU", { seat: (socketInfo[socket.id].seat - 1), wait: socketInfo[socket.id].wait });
		if (socketInfo[socket.id].wait == 1) {
			for (var k in socketInfo) {
				var lSocket4 = socketInfo[k];
				if (lSocket4.room == data.room) {
					socket.emit("WatchPlayerJoin", {
						seat: (lSocket4.seat - 1),
						avatar: lSocket4.avatar,
						avatarStr: lSocket4.avatarStr,
						name: lSocket4.name,
						chips: lSocket4.chips,
						bot: lSocket4.bot,
						wait: lSocket4.wait
					});
				}
			}
		}
		if (socket.adapter.rooms[data.room].play == 0)
			socket.adapter.rooms[data.room].play = 1;
	});

	socket.on("BET", function () {
		var socRoom = socketInfo[socket.id].socket.adapter.rooms[socketInfo[socket.id].room];
		var fBet = socRoom.maxBet - socketInfo[socket.id].currBet;
		socketInfo[socket.id].chips -= fBet;
		socketInfo[socket.id].currBet += fBet;
		socketInfo[socket.id].currBet2 += fBet;
		socRoom.potValue += fBet;
		if (socketInfo[socket.id].chips <= 0)
			socketInfo[socket.id].allin = 1;
		socket.emit("BET", {
			betAmount: socketInfo[socket.id].currBet,
			seat: (socketInfo[socket.id].seat - 1),
			chips: socketInfo[socket.id].chips,
			allin: socketInfo[socket.id].allin
		});
		socket.broadcast.in(socketInfo[socket.id].room).emit("BET", {
			betAmount: socketInfo[socket.id].currBet,
			seat: (socketInfo[socket.id].seat - 1),
			chips: socketInfo[socket.id].chips,
			allin: socketInfo[socket.id].allin
		});
		Find_NextPlayer(socRoom, socketInfo[socket.id]);
		socRoom.gameTimer = 0;
	});
	socket.on("RAISE", function (data) {
		var socRoom = socketInfo[socket.id].socket.adapter.rooms[socketInfo[socket.id].room];
		round_Finished(socRoom, socketInfo[socket.id]);
		socketInfo[socket.id].chips -= parseInt(data.raise);
		socketInfo[socket.id].currBet += parseInt(data.raise);
		socketInfo[socket.id].currBet2 += parseInt(data.raise);
		socRoom.maxBet = socketInfo[socket.id].currBet;
		socRoom.potValue += parseInt(data.raise);
		if (socketInfo[socket.id].chips <= 0)
			socketInfo[socket.id].allin = 1;
		socket.emit("RAISE", {
			betAmount: socketInfo[socket.id].currBet,
			seat: (socketInfo[socket.id].seat - 1),
			chips: socketInfo[socket.id].chips,
			allin: socketInfo[socket.id].allin
		});
		socket.broadcast.in(socketInfo[socket.id].room).emit("RAISE", {
			betAmount: socketInfo[socket.id].currBet,
			seat: (socketInfo[socket.id].seat - 1),
			chips: socketInfo[socket.id].chips,
			allin: socketInfo[socket.id].allin
		});
		Find_NextPlayer(socRoom, socketInfo[socket.id]);
		socRoom.gameTimer = 0;
	});
	socket.on("CHECK", function () {
		var socRoom = socketInfo[socket.id].socket.adapter.rooms[socketInfo[socket.id].room];
		if (socRoom.currPlay == socRoom.round_end) {
			check_lastRound(socRoom, socketInfo[socket.id]);
		} else {
			socket.emit("CHECK", {
				seat: (socketInfo[socket.id].seat - 1)
			});
			socket.broadcast.in(socketInfo[socket.id].room).emit("CHECK", {
				seat: (socketInfo[socket.id].seat - 1)
			});
			Find_NextPlayer(socRoom, socketInfo[socket.id]);
		}
		socRoom.gameTimer = 0;
	});

	socket.on("FOLD", function () {
		var socRoom = socketInfo[socket.id].socket.adapter.rooms[socketInfo[socket.id].room];
		socketInfo[socket.id].fold = 1;
		socket.emit("FOLD", {
			seat: (socketInfo[socket.id].seat - 1)
		});
		socket.broadcast.in(socketInfo[socket.id].room).emit("FOLD", {
			seat: (socketInfo[socket.id].seat - 1)
		});
		if (socRoom.currPlay == socRoom.round_end)
			check_lastRound(socRoom, socketInfo[socket.id]);
		else
			Find_NextPlayer(socRoom, socketInfo[socket.id]);
		socRoom.gameTimer = 0;

		if (Game_Finished(socketInfo[socket.id]) <= 1) {
			console.log("win");
			socRoom.play = 5;
		}
	});
	socket.on("UserRegister", function (data) {
		RegisterMySql(data, socket);
	});
	socket.on("VerifyUser", function (data) {
		VerifyUserDB(data, socket, 1);
	});
	socket.on("GetDocuments", function (data) {
		GetAllDocumentDB(data, socket);
	});
	socket.on("Update_Name", function (data) {
		UpdateNameFunc(socket, data);
	});
	socket.on("Update_Level_XP", function (data) {
		UpdateLevelFunc(socket, data);
		UpdateXPFunc(socket, data);
	});

	socket.on("PlayerDetails", function () {
		var lSocket = socketInfo[socket.id];
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			if (lSocket2.room == lSocket.room) {
				socket.emit("PlayerDetails", {
					bot: lSocket2.bot,
					avatar: lSocket2.avatar,
					name: lSocket2.name,
					chips: lSocket2.chips,
					status: "yes",
					id: (lSocket2.seat - 1)
				});
				if (lSocket2.bot == 0)
					getAvatarpDetails(socket, lSocket2.id, (lSocket2.seat - 1));
			}
		}

	});
	socket.on("PlayerDetailsSingle", function (data) {
		var lSocket = socketInfo[socket.id];
		console.log("ddd " + data.seat);
		var empty = 0;
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			if (lSocket2.room == lSocket.room && (lSocket2.seat - 1) == data.seat) {
				socket.emit("PlayerDetailsSingle", {
					seat: (lSocket2.seat - 1),
					bot: lSocket2.bot,
					avatar: lSocket2.avatar,
					name: lSocket2.name,
					chips: lSocket2.chips,
					avatarStr: lSocket2.avatarStr,
					level: lSocket2.level,
					vip: lSocket2.vip
				});
				if ((lSocket2.seat - 1) != (lSocket.seat - 1))
					CheckFriends(socket, lSocket.id, lSocket2.id);
				empty = 1;
			}
		}
		if (empty == 0)
			socket.emit("CheckFriends", { status: "no" });

	});
	socket.on("AddFriend", function (data) {
		var lSocket = socketInfo[socket.id];
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			if (lSocket2.room == lSocket.room && (lSocket2.seat - 1) == data.seat && lSocket2.bot == 0) {
				addInvitation(parseInt(lSocket.id), parseInt(lSocket2.id));
			}
		}
	});

	socket.on("InvitationPanel", function (data) {
		getInvitationDetail(socket, data);
	});
	socket.on("FriendsPanel", function (data) {
		getFriendsDetail(socket, data);
	});
	socket.on("MessagesPanel", function (data) {
		getMessagesDetail(socket, data);
	});
	socket.on("UpdateAvatar", function (data) {
		var sql = "UPDATE avatar set avatar_str = ? WHERE idvalue = ?";
		pool.query(sql, [data.avatarStr, data.id], function (err, result) {
			if (err) {
				console.log("error update document");
			} else {
				console.log("update success");
			}
		});
	});
	socket.on("AcceptInvitation", function (data) {
		deleteInvitation(data.id);
		addFriends(data.to, data.from);
	});
	socket.on("WriteMessage", function (data) {
		var idvalue = data.idvalue;
		var idvalue2 = data.idvalue2;
		var message = data.message;
		var today = new Date();
		var post = { idvalue: idvalue, idvalue2: idvalue2, message: message, created_at: today };
		pool.query('INSERT INTO messages SET ?', post, function (error, result, fields) {
			if (error) {
				console.log("user already registered  " + result + " " + error);
			} else {
				console.log("user registered sucessfully ");
				GetMessages(socket, data);
			}
		});
	});
	socket.on("GetMessage", function (data) {
		GetMessages(socket, data);
	});

	socket.on("TransferChips", function (data) {
		var idvalue = data.idvalue;
		var idvalue2 = data.idvalue2;
		var amount = data.amount;
		var today = new Date();
		var post = { idvalue: idvalue, idvalue2: idvalue2, name: data.name, name2: data.name2, amount: amount, created_at: today };
		pool.query('INSERT INTO transfer_chips SET ?', post, function (error, result, fields) {
			if (error) {
				console.log("user already registered  " + result + " " + error);
			} else {
				console.log("user registered sucessfully ");
				socket.emit("TransferChips", {});
				TransferChipsUpdate(data);
			}
		});
	});
	socket.on("GetTransfer", function (data) {
		GetTransferFunc(socket, data);
	});
	socket.on("Redeem", function (data) {
		RedeemFunc(socket, data);
	});
	socket.on("ChipsLeader", function (data) {
		ChipsLeaderFunc(socket, data);
	});
	socket.on("Update_Chips", function (data) {
		UpdateChipsFunc(socket, data);
	});
	socket.on("ContinueSockets", function (data) {
		socket.emit("ContinueSockets", {});
		/*var lSocket = socketInfo[socket.id];
		if (lSocket != undefined) {
			lSocket.seconds = parseInt(data.seconds);

		}*/
	});


	socket.on("HandReward", function (data) {
		handRewardCheck(socket, data.id);
	});
	socket.on("DeleteReward", function (data) {
		deleteHandReward(data.id);
	});

	socket.on("writeLevelReward", function (data) {
		writeLevelReward(data.id, parseInt(data.message));
	});

	socket.on("LevelReward", function (data) {
		levelRewardCheck(socket, data.id);
	});

	socket.on("LevelRewardUpdate", function (data) {
		levelRewardUpdate(data);
	});

	socket.on("FriendRewardUpdate", function (data) {
		friendRewardUpdate(data);
	});

	socket.on("FriendReward", function (data) {
		friendReward(socket, data.id);
	});
	socket.on("VIP", function (data) {
		update_vip(socket, data.email, data.vip);
	});

	socket.on("GETVIP", function (data) {
		var sql = 'SELECT * FROM categories WHERE email = ?';
		pool.query(sql, [data.email], function (error, result, fields) {
			if (result.length != 0) {
				console.log(result[0].vip_date + " " + data.email);
				let date_1 = result[0].vip_date;
				let date_2 = new Date();
				const days = (date_1, date_2) => {
					let difference = date_1.getTime() - date_2.getTime();
					let TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
					return TotalDays;
				}
				//console.log(days(date_2, date_1) + " days to world cup");
				if (days(date_2, date_1) >= 31) {
					socket.emit("GETVIP", { vip: "Normal", });
					update_vip(socket, data.email, "Normal");
				}
			}

		});
	});
	socket.on("InsertAvatar", function (data) {
		InsertAvatar(data);
	});

	socket.on("disconnect", function () {
		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			if (lSocket.socket.id == socket.id) {
				console.log("Remove 1 " + lSocket.localSocketId);
				lSocket.removePlayer = 1;
				//delete socketInfo[lSocket.localSocketId];
			}
		}
	});
});
listOfUsers = function () {
	for (var i = 0; i < clients.length; i++) {
		console.log("Now " + clients[i].name + " ONLINE");
	}
}

server.listen(app.get('port'), function () {
	console.log("Server is Running : " + server.address().port);
});

function RegisterMySql(data, lSocket) {
	var email = data.email;
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		var isAvailableChe;
		for (var i in result) {
			if (result[i].email == email) {
				isAvailableChe = true;
			}
		}
		if (!isAvailableChe) {
			RegisterReferralCode(data, lSocket);
		} else {
			VerifyUserDB(data, lSocket, 1);
		}
	});
}
function RegisterReferralCode(data, lSocket) {
	var referral_code = referralCodeGenerator.alphaNumeric('uppercase', 4, 1);
	var sql = 'SELECT * FROM categories WHERE referral_code = ?';
	pool.query(sql, [referral_code], function (error, result, fields) {
		var isAvailableChe;
		for (var i in result) {
			if (result[i].referral_code == referral_code) {
				isAvailableChe = true;
			}
		}
		if (!isAvailableChe) {
			RegisterDB2(data, lSocket, referral_code);
		} else {
			RegisterReferralCode(data, lSocket);
		}
	});
}
function RegisterDB2(data, lSocket, referral_code) {
	if (data.login == "guest") {
		var rIndex = Math.floor(Math.random() * botName.length);
		data.name = botName[rIndex];
	}
	var today = new Date();
	data.created_at = today;
	data.updated_at = today;
	data.chips = 3000000000;
	data.cash = 0;
	data.level = 1;
	data.xp = 0;
	data.vip = "Normal";
	data.vip_date = today;
	data.status = "Active";
	data.referral_code = referral_code;
	data.guest = "1";
	var pWord = bcrypt.hashSync(data.password, bcrypt.genSaltSync(8), null);
	//let hash = bcrypt.hashSync(data.password, 10);
	var post = {
		name: data.name, password: "", username: "", email: data.email, chips: data.chips, cash: data.cash, level: data.level,
		xp: data.xp, vip: data.vip, vip_date: data.vip_date, referral_code: data.referral_code,
		referby_friends: "", mobile: "", status: data.status, created_at: data.created_at, updated_at: data.updated_at,
		verify_mobile: "not_verify", bonus: 0
	};
	pool.query('INSERT INTO categories SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("user already registered  " + result + " " + error);
		} else {
			console.log("user registered sucessfully ");
			VerifyUserDB(data, lSocket, 0);
		}
	});
}

async function VerifyUserDB(data, lSocket, regValue) {
	var email = data.email;
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		var empty = 0;
		for (var i in result) {
			const ppp = bcrypt.compareSync(data.password, result[i].password);
			if (result[i].email == email) {
				empty = 1;
				lSocket.emit("VerifyUser", {
					id: result[0].id, name: result[i].name, email: result[i].email, password: data.password, chips: result[i].chips, cash: result[i].cash,
					level: result[i].level, xp: result[i].xp, vip: result[i].vip, status: "yes", guest: data.guest, referby_friends: result[i].referby_friends,
					mobile: result[i].mobile, verify_mobile: result[i].verify_mobile, bonus: result[i].bonus, referral_code: result[i].referral_code,
					regValue: regValue, imageUrl: data.imageUrl
				});
				if (regValue == 1)
					verifyAvatar(lSocket, result[0].id);
			}
		}
		if (empty == 0)
			lSocket.emit("VerifyUser", { email: email, status: "no" });
		return empty;
	});
}
function verifyAvatar(lSocket, idValue) {
	var to = idValue;
	var sql = 'SELECT * FROM avatar WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("verifyAvatar", {
				avatarStr: result[i].avatar_str, id: idValue, status: "no"
			});
		}
	});
}
function InsertAvatar(data) {
	var fvalue = data.id;
	var avatarStr = data.avatarStr;
	var post = {
		idvalue: fvalue, avatar_str: avatarStr
	};
	pool.query('INSERT INTO avatar SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("user already registered  " + result + " " + error);
		} else {
			console.log("user registered sucessfully ");
		}
	});
}
function GetAllDocumentDB(data, lSocket) {
	console.log("raja ");
	pool.query("SELECT * FROM players", function (err, result, fields) {
		if (!err) {
			var empty = 0;
			var cValue = 0;
			for (var i = 0; i < result.length; i++) {
				var ch3 = true;
				if (data.one == "yes" && cValue != 0)
					ch3 = false;

				if (ch3) {
					var rLength = 0;
					for (var j in socketInfo) {
						var lSocket2 = socketInfo[j];
						if (lSocket2.socket.adapter.rooms[lSocket2.room] != undefined) {
							if (lSocket2.room == result[i].points) {
								rLength = lSocket2.socket.adapter.rooms[lSocket2.room].length;
							}
						}
					}
					if (data.one == "no") {
						lSocket.emit("GetDocuments", {
							id: result[i].id, players: result[i].entry_fee, firstprize: result[i].firstprize, roomLength: rLength,
							status: "yes"
						});
					} else if (data.one == "yes") {
						if (cValue == 0) {
							if (data.fValue == result[i].entry_fee) {
								cValue += 1;
								lSocket.emit("GetDocuments2", {
									id: result[i].id, players: result[i].entry_fee, firstprize: result[i].firstprize, roomLength: rLength,
									status: "yes"
								});
							}
						}
					} else if (data.one == "similar") {
						console.log("dd " + parseInt(data.startBet, 10) + " " + result[i].entry_fee + " " + parseInt(data.room, 10) + " " + result[i].id);
						if (parseInt(data.startBet, 10) == result[i].entry_fee && parseInt(data.room, 10) != result[i].id) {
							lSocket.emit("GetDocuments3", {
								id: result[i].id, players: result[i].entry_fee, firstprize: result[i].firstprize, roomLength: rLength,
								status: "yes"
							});
						}

					}
				}

				empty = 1;
			}
			if (empty == 0) {
				lSocket.emit("GetDocuments", {
					status: "no"
				});
			}
		}
	});
}
function UpdateNameFunc(lSocket, data) {
	var sql = "UPDATE categories set name = ? WHERE email = ?";
	pool.query(sql, [data.name, data.email], function (err, result) {
		if (err) {
			console.log("error update document");
		} else {
			console.log("update success");
		}

	});
}
function UpdateChipsFunc(lSocket, data) {
	var sql = "UPDATE categories set chips = ? WHERE email = ?";
	pool.query(sql, [data.chips, data.email], function (err, result) {
		if (err) {
			console.log("error update document");
		} else {
			console.log("update success");
		}
	});
}

function UpdateLevelFunc(lSocket, data) {
	var sql = "UPDATE categories set level = ? WHERE email = ?";
	pool.query(sql, [data.level, data.email], function (err, result) {
		if (err) {
			console.log("error update document");
		} else {
			console.log("update success");
		}
	});
}
function UpdateXPFunc(lSocket, data) {
	var sql = "UPDATE categories set xp = ? WHERE email = ?";
	pool.query(sql, [data.xp, data.email], function (err, result) {
		if (err) {
			console.log("error update document");
		} else {
			console.log("update success");
		}
	});
}
function addInvitation(fromValue, toValue) {
	var fvalue = fromValue;
	var tvalue = toValue;
	var post = {
		from: fvalue, toper: tvalue
	};
	pool.query('INSERT INTO Invitations SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("user already registered  " + result + " " + error);
		} else {
			console.log("user registered sucessfully ");

		}
	});
}
function getInvitationDetail(lSocket, data) {
	var toVar = parseInt(data.id);
	var sql = 'SELECT * FROM Invitations WHERE toper = ?';
	pool.query(sql, [toVar], function (error, result, fields) {
		for (var i in result) {
			console.log(result[i].toper + " " + data.id);
			getInvitationDetail2(lSocket, result[i].toper, result[i].from, result[i].id);
		}
		if (result.length == 0)
			lSocket.emit("InvitationPanel", {});
	});
}
function getInvitationDetail2(lSocket, toValue, fromValue, idValue) {
	var to = fromValue;
	var sql = 'SELECT * FROM categories WHERE id = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("InvitationPanel", {
				name: result[i].name, toValue: toValue, fromValue: fromValue, avatarStr: result[i].avatar_str, idValue: idValue, status: "yes",
				id: result[i].id
			});
			getInvitationAvatar(lSocket, result[i].id);
		}
	});
}
function getInvitationAvatar(lSocket, idValue) {
	var to = idValue;
	var sql = 'SELECT * FROM avatar WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("InvitationPanel", {
				avatarStr: result[i].avatar_str, idValue: idValue, status: "no"
			});
		}
	});
}
function deleteInvitation(idValue) {
	var to = parseInt(idValue);
	var sql = 'DELETE FROM Invitations WHERE id = ?';
	pool.query(sql, [to], function (error, result, fields) {

	});
}

function addFriends(toValue, fromValue) {
	var fvalue = fromValue;
	var tvalue = toValue;
	var post = {
		player: fvalue, friends: tvalue
	};
	pool.query('INSERT INTO friends_list SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("user already registered  " + result + " " + error);
		} else {
			console.log("user registered sucessfully ");
			addFriends2(toValue, fromValue);
		}
	});
}
function addFriends2(toValue, fromValue) {
	var fvalue = fromValue;
	var tvalue = toValue;
	var post = {
		player: tvalue, friends: fvalue
	};
	pool.query('INSERT INTO friends_list SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("user already registered  " + result + " " + error);
		} else {
			console.log("user registered sucessfully ");
		}
	});
}

function getFriendsDetail(lSocket, data) {
	var player = parseInt(data.id);
	var sql = 'SELECT * FROM friends_list WHERE player = ?';
	pool.query(sql, [player], function (error, result, fields) {
		for (var i in result) {
			getFriendsDetail2(lSocket, result[i].player, result[i].friends);
		}
		if (result.length == 0)
			lSocket.emit("FriendsPanel", {});

	});
}
function getFriendsDetail2(lSocket, player, friends) {
	var friends = parseInt(friends);
	var sql = 'SELECT * FROM categories WHERE id = ?';
	pool.query(sql, [friends], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("FriendsPanel", {
				name: result[i].name, player: player, friends: friends, avatarStr: result[i].avatar_str, status: "yes",
				id: result[i].id
			});
			getFriendsAvatar(lSocket, result[i].id);
		}
	});
}
function getFriendsAvatar(lSocket, idValue) {
	var to = idValue;
	var sql = 'SELECT * FROM avatar WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("FriendsPanel", {
				avatarStr: result[i].avatar_str, idValue: idValue, status: "no"
			});
		}
	});
}

function GetMessages(lSocket, data) {
	var messageData = [];
	var sortData = [];
	var sideData = [];
	var to = data.idvalue;
	console.log(to);
	var sql = 'SELECT * FROM messages WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			sortData.push(result[i].id);
			messageData.push(result[i]);
			sideData.push("right");
		}
		GetMessages2(lSocket, data, sortData, messageData, sideData);
	});

}
function GetMessages2(lSocket, data, sortData, messageData, sideData) {
	var to = data.idvalue2;
	var sql = 'SELECT * FROM messages WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			sortData.push(result[i].id);
			messageData.push(result[i]);
			sideData.push("left");
		}
		sortData.sort(function (a, b) { return b - a });
		for (var i in sortData) {
			for (var j in messageData) {
				if (sortData[i] == messageData[j].id) {
					lSocket.emit("GetMessage", { message: messageData[j].message, side: sideData[j] });
				}
			}
		}
	});
}

function getMessagesDetail(lSocket, data) {
	var player = parseInt(data.id);
	var sql = 'SELECT * FROM friends_list WHERE player = ?';
	pool.query(sql, [player], function (error, result, fields) {
		for (var i in result) {
			getMessagesDetail2(lSocket, result[i].player, result[i].friends);
		}
		if (result.length == 0)
			lSocket.emit("MessagesPanel", {});
	});
}
function getMessagesDetail2(lSocket, player, friends) {
	var sql = 'SELECT * FROM messages WHERE idvalue = ?';
	pool.query(sql, [friends], function (error, result, fields) {
		if (result.length == 0) {
			getMessagesDetail3(lSocket, player, friends);
		} else {
			getMessagesDetail4(lSocket, player, friends);
		}
	});
}
function getMessagesDetail3(lSocket, player, friends) {
	var sql = 'SELECT * FROM messages WHERE idvalue2 = ?';
	pool.query(sql, [friends], function (error, result, fields) {
		if (result.length == 0) {
			lSocket.emit("MessagesPanel", {});
		} else {
			getMessagesDetail4(lSocket, player, friends);
		}
	});
}

function getMessagesDetail4(lSocket, player, friends) {
	var friends = parseInt(friends);
	var sql = 'SELECT * FROM categories WHERE id = ?';
	pool.query(sql, [friends], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("MessagesPanel", {
				name: result[i].name, player: player, friends: friends, status: "yes",
				id: result[i].id
			});
			getMessagesAvatar(lSocket, result[i].id);
		}
	});
}
function getMessagesAvatar(lSocket, idValue) {
	var to = idValue;
	var sql = 'SELECT * FROM avatar WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("MessagesPanel", {
				avatarStr: result[i].avatar_str, idValue: idValue, status: "no"
			});
		}
	});
}
function CheckFriends(lSocket, meValue, friendsValue) {
	var sql = 'SELECT * FROM friends_list WHERE player = ? AND friends =?';
	pool.query(sql, [meValue, friendsValue], function (error, result, fields) {
		if (result.length != 0) {
			lSocket.emit("CheckFriends", { status: "yes" });
		} else {
			lSocket.emit("CheckFriends", { status: "no" });
		}
		console.log("rr " + result.length);
	});
}
function TransferChipsUpdate(data) {
	var sql = 'SELECT * FROM categories WHERE id = ?';
	pool.query(sql, [data.idvalue2], function (error, result, fields) {
		if (result.length != 0) {
			var cChips = parseInt(result[0].chips) + parseInt(data.amount);
			TransferChipsUpdate2(data, cChips);
		}
	});
}
function TransferChipsUpdate2(data, cChips) {
	var sql = "UPDATE categories set chips = ? WHERE id = ?";
	pool.query(sql, [cChips, data.idvalue2], function (err, result) {
		if (err) {
			console.log("error update document");
		} else {
			console.log("update success");
		}
	});
}
function GetTransferFunc(lSocket, data) {
	var messageData = [];
	var sortData = [];
	var player = parseInt(data.id);
	var sql = 'SELECT * FROM transfer_chips WHERE idvalue = ?';
	pool.query(sql, [player], function (error, result, fields) {
		for (var i in result) {
			messageData.push(result[i]);
			sortData.push(result[i].id);
		}
		GetTransferFunc2(lSocket, data, messageData, sortData);
		if (result.length == 0)
			lSocket.emit("GetTransfer", {});
	});
}
function GetTransferFunc2(lSocket, data, messageData, sortData) {
	var player = parseInt(data.id);
	var sql = 'SELECT * FROM transfer_chips WHERE idvalue2 = ?';
	pool.query(sql, [player], function (error, result, fields) {
		for (var i in result) {
			messageData.push(result[i]);
			sortData.push(result[i].id);
		}
		sortData.sort(function (a, b) { return b - a });
		for (var i in sortData) {
			for (var j in messageData) {
				if (sortData[i] == messageData[j].id) {
					lSocket.emit("GetTransfer", {
						idvalue: messageData[j].idvalue, idvalue2: messageData[j].idvalue2,
						amount: messageData[j].amount, id: messageData[j].id, name: messageData[j].name, name2: messageData[j].name2,
						created_at: messageData[j].created_at, status: "yes"
					});
					getTransferAvatar(lSocket, messageData[j].idvalue, messageData[j].id);
					getTransferAvatar2(lSocket, messageData[j].idvalue2, messageData[j].id);
				}
			}
		}
	});
}
function getTransferAvatar(lSocket, idValue, id) {
	var to = idValue;
	var sql = 'SELECT * FROM avatar WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("GetTransfer", {
				avatarStr: result[i].avatar_str, idValue: idValue, status: "no", id: id
			});
		}
	});
}
function getTransferAvatar2(lSocket, idValue, id) {
	var to = idValue;
	var sql = 'SELECT * FROM avatar WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("GetTransfer", {
				avatarStr2: result[i].avatar_str, idValue: idValue, status: "no", id: id
			});
		}
	});
}

function RedeemFunc(lSocket, data) {
	var sql = 'SELECT * FROM categories WHERE id = ?';
	pool.query(sql, [data.id], function (error, result, fields) {
		if (result.length != 0) {
			if (result[0].referby_friends == "") {
				RedeemFunc2(lSocket, data);
			} else
				lSocket.emit("Redeem", { status: "already" });
		} else
			lSocket.emit("Redeem", { status: "no" });
	});
}
function RedeemFunc2(lSocket, data) {
	var sql = 'SELECT * FROM categories WHERE referral_code = ?';
	pool.query(sql, [data.redeem], function (error, result, fields) {
		if (result.length != 0) {
			if (result[0].id != parseInt(data.id)) {
				lSocket.emit("Redeem", { status: "yes" });
				var cChips = parseInt(result[0].chips) + parseInt(data.redeemAmt);
				RedeemFunc3(result[0].id, cChips);
				RedeemFunc4(data);
			} else
				lSocket.emit("Redeem", { status: "no" });
		} else
			lSocket.emit("Redeem", { status: "no" });
	});
}
function RedeemFunc3(idvalue, cChips) {
	WriteFriendReward(idvalue);
	var sql = "UPDATE categories set chips = ? WHERE id = ?";
	pool.query(sql, [cChips, idvalue], function (err, result) {
		if (err) {
			console.log("error update document");
		}
	});
}
function RedeemFunc4(data) {
	var sql = "UPDATE categories set referby_friends = ? WHERE id = ?";
	pool.query(sql, [data.redeem, data.id], function (err, result) {
		if (err) {
			console.log("error update document");
		}
	});
}
function getAvatarpDetails(lSocket, idValue, seat) {
	var to = idValue;
	var sql = 'SELECT * FROM avatar WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("PlayerDetails", {
				avatarStr: result[i].avatar_str, id: seat, status: "no"
			});
		}
	});
}

function ChipsLeaderFunc(lSocket, data) {
	if (data.leaderValue == "0") {
		var sql = 'SELECT * FROM categories ORDER BY chips DESC LIMIT 100';
		pool.query(sql, function (error, result, fields) {
			for (var i in result) {
				//console.log(result[i].name);
				lSocket.emit("ChipsLeader", {
					rank: i, id: result[i].id, name: result[i].name, chips: result[i].chips, level: result[i].level, status: "yes"
				});
				leaderboardAvatar(lSocket, result[i].id);
			}

		});
	} else if (data.leaderValue == "2") {
		var sql = 'SELECT * FROM categories ORDER BY jp_chips DESC LIMIT 100';
		pool.query(sql, function (error, result, fields) {
			for (var i in result) {
				//console.log(result[i].name);
				lSocket.emit("ChipsLeader", {
					rank: i, id: result[i].id, name: result[i].name, chips: result[i].jp_chips, level: result[i].level, status: "yes"
				});
				leaderboardAvatar(lSocket, result[i].id);
			}
		});
	} else if (data.leaderValue == "3") {
		var sql = 'SELECT * FROM categories ORDER BY bjp_chips DESC LIMIT 100';
		pool.query(sql, function (error, result, fields) {
			for (var i in result) {
				//console.log(result[i].name);
				lSocket.emit("ChipsLeader", {
					rank: i, id: result[i].id, name: result[i].name, chips: result[i].bjp_chips, level: result[i].level, status: "yes"
				});
				leaderboardAvatar(lSocket, result[i].id);
			}
		});
	}

}
function leaderboardAvatar(lSocket, idValue) {
	var to = idValue;
	var sql = 'SELECT * FROM avatar WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		for (var i in result) {
			lSocket.emit("ChipsLeader", {
				avatarStr: result[i].avatar_str, id: idValue, status: "no"
			});
		}
	});
}
function writeHandReward(idValue, message) {
	console.log("wrote");
	var sValue = "available";
	var post = { idvalue: idValue, name: message, status: sValue };
	pool.query('INSERT INTO hand_rewards SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("user already registered  " + result + " " + error);
		} else {

		}
	});
}
function handRewardCheck(lSocket, idValue) {
	var to = idValue;
	var sql = 'SELECT * FROM hand_rewards WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		var empty = 0;
		for (var i in result) {
			if (result[i].status == "available") {
				empty = 1;
				lSocket.emit("HandReward", { id: result[i].id, name: result[i].name, status: "yes" });
			}
		}
		if (empty == 0)
			lSocket.emit("HandReward", { status: "no" });

	});
}
function deleteHandReward(idValue) {
	var to = parseInt(idValue);
	var sql = 'DELETE FROM hand_rewards WHERE id = ?';
	pool.query(sql, [to], function (error, result, fields) {

	});
}
function writeLevelReward(idValue, message) {
	var sValue = "available";
	var post = { idvalue: idValue, level: message, status: sValue };
	pool.query('INSERT INTO level_rewards SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("user already registered  " + result + " " + error);
		} else {

		}
	});
}
function levelRewardCheck(lSocket, idValue) {
	var to = idValue;
	var sql = 'SELECT * FROM level_rewards WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		var empty = 0;
		for (var i in result) {
			empty = 1;
			lSocket.emit("LevelReward", { id: result[i].id, level: result[i].level, status2: "yes", status: result[i].status });
		}
		if (empty == 0)
			lSocket.emit("LevelReward", { status2: "no" });

	});
}
function levelRewardUpdate(data) {
	console.log("illlai " + data.id);
	var sValue = "completed";
	var idValue = parseInt(data.id);
	var sql = "UPDATE level_rewards set status = ? WHERE idvalue = ?";
	pool.query(sql, [sValue, idValue], function (err, result) {
		if (err) {
			console.log("error update document");
		}
	});
}
function WriteFriendReward(idvalue) {
	var sValue = "available";
	var post = { idvalue: idvalue, status: sValue };
	pool.query('INSERT INTO friend_rewards SET ?', post, function (error, result, fields) {
	});
}
function friendReward(lSocket, idValue) {
	var to = idValue;
	var sql = 'SELECT * FROM friend_rewards WHERE idvalue = ?';
	pool.query(sql, [to], function (error, result, fields) {
		var empty = 0;
		for (var i in result) {
			empty = 1;
			lSocket.emit("FriendReward", { id: result[i].id, status2: "yes", status: result[i].status, count: i });
		}
		if (empty == 0)
			lSocket.emit("FriendReward", { status2: "no" });

	});
}
function friendRewardUpdate(data) {
	var sValue = "completed";
	var idValue = parseInt(data.id);
	var sql = "UPDATE friend_rewards set status = ? WHERE idvalue = ?";
	pool.query(sql, [sValue, idValue], function (err, result) {
		if (err) {

		}
	});
}
function update_vip(lSocket, email, vip) {
	var today = new Date();
	var sql = "UPDATE categories set vip = ?,vip_date = ? WHERE email = ?";
	pool.query(sql, [vip, today, email], function (err, result) {
		if (err) {
			console.log("error update document");
		} else {
			console.log("update success");
			get_vip(lSocket, email);
		}
	});


}
function get_vip(lSocket, email) {
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		if (result.length != 0) {
			lSocket.emit("GETVIP", { vip: result[0].vip, });
		}
	});
}



