import { IUdTickable } from "../../../extension/update/IUdTickable";
import { UdTickHub } from "../../../extension/update/UdTickHub";
import { UdRandomKit } from "../../../extension/utils/UdRandomKit";
import { UdMathLabel } from "../../../extension/game/UdMathLabel";
import { UdSprite } from "../../../extension/game/UdSprite";

const COIN_IMAGE = "udGame/ui/auto/common_icon_jinbi_shuimo";

enum Phase { Burst, Pause, Fly, Done }

class CoinFlyData {
    node: cc.Node;
    phase: Phase = Phase.Burst;
    elapsed: number = 0;

    burstFrom: cc.Vec2;
    burstTarget: cc.Vec2;
    burstDuration: number;

    pauseDuration: number = 1.0;

    p0: cc.Vec2;
    p1: cc.Vec2;
    p2: cc.Vec2;
    p3: cc.Vec2;
    flyDuration: number;

    targetLabel: UdMathLabel;
    targetNode: cc.Node;
    scorePerCoin: number;
}

export class UdCoinFly implements IUdTickable {

    private static _ins: UdCoinFly;

    static spawn(
        parent: cc.Node,
        fromWorld: cc.Vec2,
        toNode: cc.Node,
        scorePerCoin: number,
        idx: number,
        total: number,
    ): void {
        console.log("[UdCoinFly] spawn idx=", idx, "total=", total);
        if (!UdCoinFly._ins) {
            UdCoinFly._ins = new UdCoinFly();
            UdTickHub.Ins.addUpdateHandler(UdCoinFly._ins);
            console.log("[UdCoinFly] registered tick handler");
        }
        UdCoinFly._ins._createCoin(parent, fromWorld, toNode, scorePerCoin, idx, total);
    }

    private _coins: CoinFlyData[] = [];

    private _createCoin(
        parent: cc.Node,
        fromWorld: cc.Vec2,
        toNode: cc.Node,
        scorePerCoin: number,
        idx: number,
        total: number,
    ): void {
        if (!cc.isValid(parent)) {
            console.warn("[UdCoinFly] parent invalid");
            return;
        }

        const node = new cc.Node("coin_fly");
        const sprite = node.addComponent(UdSprite);
        sprite.source = COIN_IMAGE;
        node.setContentSize(24, 24);
        node.zIndex = 1000;
        parent.addChild(node);

        const localFrom = parent.convertToNodeSpaceAR(fromWorld);
        node.setPosition(localFrom);
        node.scale = 0;
        node.opacity = 0;

        const coin = new CoinFlyData();
        coin.node = node;
        coin.burstFrom = localFrom;

        const burstAngle = (idx / total) * Math.PI * 2 + UdRandomKit.getRandomNumber(-0.3, 0.3);
        const burstDist = UdRandomKit.getRandomNumber(60, 140);
        coin.burstTarget = cc.v2(
            localFrom.x + Math.cos(burstAngle) * burstDist,
            localFrom.y + Math.sin(burstAngle) * burstDist + UdRandomKit.getRandomNumber(20, 60),
        );
        coin.burstDuration = UdRandomKit.getRandomNumber(0.15, 0.25);

        const localTo = parent.convertToNodeSpaceAR(
            toNode.parent.convertToWorldSpaceAR(toNode.getPosition()),
        );
        coin.p3 = cc.v2(
            localTo.x + UdRandomKit.getRandomNumber(-15, 15),
            localTo.y + UdRandomKit.getRandomNumber(-10, 10),
        );
        coin.flyDuration = UdRandomKit.getRandomNumber(0.45, 0.7);

        coin.targetLabel = toNode.getComponent(UdMathLabel);
        coin.targetNode = toNode;
        coin.scorePerCoin = scorePerCoin;

        this._coins.push(coin);
        console.log("[UdCoinFly] coin created, total coins=", this._coins.length);
    }

    onUpdate(dt: number): void {
        if (this._coins.length > 0) {
            // 只在新的一批有金币时打印一次
        }

        for (let i = this._coins.length - 1; i >= 0; i--) {
            const coin = this._coins[i];

            if (!coin.node || !cc.isValid(coin.node)) {
                this._removeCoin(i);
                continue;
            }

            coin.elapsed += dt;

            switch (coin.phase) {
                case Phase.Burst: this._tickBurst(coin); break;
                case Phase.Pause: this._tickPause(coin); break;
                case Phase.Fly:   this._tickFly(coin, dt);   break;
            }
        }
    }

    private _tickBurst(coin: CoinFlyData): void {
        const t = Math.min(coin.elapsed / coin.burstDuration, 1.0);
        const ease = 1 - Math.pow(1 - t, 2);

        coin.node.setPosition(cc.v2(
            coin.burstFrom.x + (coin.burstTarget.x - coin.burstFrom.x) * ease,
            coin.burstFrom.y + (coin.burstTarget.y - coin.burstFrom.y) * ease,
        ));
        coin.node.scale = t * 1.2;
        coin.node.opacity = Math.floor(t * 255);
        coin.node.angle = t * 360;

        if (t >= 1.0) {
            coin.node.scale = 1.0;
            coin.node.opacity = 255;
            coin.elapsed = 0;
            coin.p0 = coin.node.getPosition();
            this._buildFlyControlPoints(coin);
            coin.phase = Phase.Pause;
        }
    }

    private _tickPause(coin: CoinFlyData): void {
        coin.node.scale = 1.0 + 0.04 * Math.sin(coin.elapsed * 3);

        if (coin.elapsed >= coin.pauseDuration) {
            coin.elapsed = 0;
            coin.phase = Phase.Fly;
        }
    }

    private _tickFly(coin: CoinFlyData, dt: number): void {
        const t = Math.min(coin.elapsed / coin.flyDuration, 1.0);

        const u = 1 - t;
        const uu = u * u;
        const uuu = uu * u;
        const tt = t * t;
        const ttt = tt * t;

        coin.node.setPosition(cc.v2(
            uuu * coin.p0.x + 3 * uu * t * coin.p1.x + 3 * u * tt * coin.p2.x + ttt * coin.p3.x,
            uuu * coin.p0.y + 3 * uu * t * coin.p1.y + 3 * u * tt * coin.p2.y + ttt * coin.p3.y,
        ));
        coin.node.scale = 1.0 - t * 0.45;
        coin.node.angle += dt * 180;

        if (t >= 1.0) {
            this._onArrive(coin);
        }
    }

    private _buildFlyControlPoints(coin: CoinFlyData): void {
        const dx = coin.p3.x - coin.p0.x;
        const dy = coin.p3.y - coin.p0.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const arcHeight = Math.max(dist * 0.7, 100);

        const midX = (coin.p0.x + coin.p3.x) * 0.5;
        const midY = Math.max(coin.p0.y, coin.p3.y) + arcHeight;

        coin.p1 = cc.v2(
            midX + UdRandomKit.getRandomNumber(-arcHeight * 0.3, arcHeight * 0.3),
            midY,
        );
        coin.p2 = cc.v2(
            midX + UdRandomKit.getRandomNumber(-arcHeight * 0.2, arcHeight * 0.2),
            midY + arcHeight * 0.2,
        );
    }

    private _onArrive(coin: CoinFlyData): void {
        if (coin.targetLabel && cc.isValid(coin.targetLabel.node)) {
            coin.targetLabel.value += coin.scorePerCoin;
        }
        if (coin.targetNode && cc.isValid(coin.targetNode)) {
            cc.Tween.stopAllByTarget(coin.targetNode);
            coin.targetNode.scale = 1;
            cc.tween(coin.targetNode)
                .to(0.06, { scale: 1.15 }, { easing: cc.easing.backOut })
                .to(0.1, { scale: 1 })
                .start();
        }
        coin.node.destroy();
        coin.node = null;
    }

    private _removeCoin(i: number): void {
        const last = this._coins.length - 1;
        if (i !== last) {
            this._coins[i] = this._coins[last];
        }
        this._coins.pop();
    }
}
