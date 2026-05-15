import { UIMgr } from "../../../core/manager/UIMgr";
import { PopMgr } from "../../../core/popMessage/PopMgr";
import { BaseView } from "../../../core/view/compoment/BaseView";
import { List } from "../../../extension/basecore/List";
import { RefClass } from "../../../extension/basecore/RefDecorator";
import { BtnEventType } from "../../../extension/components/GameBtn/BtnEventType";
import { GameButton } from "../../../extension/game/GameButton";
import { GameLabel } from "../../../extension/game/GameLabel";
import { GameSpine } from "../../../extension/game/GameSpine";
import { TimeMgr } from "../../../extension/time/TimeMgr";
import { ClassUtils } from "../../../extension/utils/ClassUtils";
import { RandomUtils } from "../../../extension/utils/RandomUtils";
import { UIEventType } from "../../../extension/view/types/UIEventType";
import { UILayerType } from "../../../extension/view/types/UILayerType";
import { MainGameFruitItem } from "../items/MainGameFruitItem";
import { IMainGameResultViewData, MainGameResultView } from "./MainGameResultView";

@RefClass
export class MainGameView extends BaseView {
    private static readonly HIGHEST_SCORE_CACHE_KEY = "HIGHEST_SCORE_CACHE_KEY";
    private static readonly REMAINING_TIME_CACHE_KEY = "REMAINING_TIME_CACHE_KEY";
    fruit_prefab: cc.Node = undefined;
    fruit_content_node: cc.Node = undefined;
    boom_eff: cc.Node = undefined;
    eff_node: cc.Node = undefined;
    line_node: cc.Node = undefined;
    preview_info_node: cc.Node = undefined;
    score_node: cc.Node = undefined;
    score_node_h: cc.Node = undefined;

    desc_lb: GameLabel = undefined;
    score_lb: GameLabel = undefined;
    score_lb_h: GameLabel = undefined;

    button_touch: GameButton = undefined;
    start_btn: GameButton = undefined;
    remaining_time_lb: GameLabel = undefined;
    add_time_btn: GameButton = undefined;

    private skip_btn: GameButton;

    _fruit_pool: List<cc.Node> = new List<cc.Node>();
    _sp_pool: List<cc.Node> = new List<cc.Node>();

    // 生成水果相关数据
    _fruit_current: cc.Node = undefined;	// 当前准备下落的水果
    _fruit_next: cc.Node = undefined;	// 等待下落的水果
    _fruit_count: number = 0;				// 已经下落的水果数量

    // 几种计时器
    _end_timer = undefined;
    _creat_timer = undefined;

    // 累计分数
    _score: number = 0;

    // 几种游戏状态 用来拦截点击
    _is_gaming: boolean = false;
    _is_creating: boolean = false;
    _is_end: boolean = false;
    _is_send: boolean = false;

    // 手写数据
    _fruit_name: string[] = ["lanmei", "shanzhu", "ningmeng", "hamigua", "qiyiguo", "huangtao", "yezi", "xigua", "daxigua"];
    _fruit_size: number[] = [50, 75, 100, 125, 150, 175, 200, 225, 250];
    _fruit_scale_size: number[] = [];
    _fruit_config: number[] = [];
    _fruit_scale_f: number = 1;
    _fruit_scale_c: number = 0;

    _info = undefined;

    _remaining_time: number = 0;

    public constructor() {
        super();
        this.prefabPath = "mainGame/prefabs/MainGameView";
    }

    public init(root: cc.Node): void {
        super.init(root);
        this.initPhysics();

        this.line_node = this.ResBase.getNode("line_node");
        this.fruit_content_node = this.ResBase.getNode("fruit_content_node");
        this.eff_node = this.ResBase.getNode("eff_node");
        this.fruit_prefab = this.ResBase.getNode("fruit_prefab");
        this.score_node = this.ResBase.getNode("score_node");
        this.score_lb = this.ResBase.getComponent("score_lb", GameLabel);
        this.score_node_h = this.ResBase.getNode("score_node_h");
        this.score_lb_h = this.ResBase.getComponent("score_lb_h", GameLabel);
        this.preview_info_node = this.ResBase.getNode("preview_info_node");
        this.start_btn = this.ResBase.getComponent("start_btn", GameButton);
        this.desc_lb = this.ResBase.getComponent("desc_lb", GameLabel);
        this.remaining_time_lb = this.ResBase.getComponent("remaining_time_lb", GameLabel);
        this.add_time_btn = this.ResBase.getComponent("add_time_btn", GameButton);
        this.boom_eff = this.ResBase.getNode("boom_eff");
        this.skip_btn = this.ResBase.getComponent("skip_btn", GameButton);


        this.button_touch = this.ResBase.getComponent("MainGameView", GameButton);

    }

    protected addEvents(): void {
        super.addEvents();
        this.button_touch.addListener(BtnEventType.OnTouchStart, this.onTouch, this);
        this.start_btn.addListener(BtnEventType.OnTouchTap, this.onStart, this);
        this.skip_btn.addListener(BtnEventType.OnTouchTap, this._onSkipBtnClick, this);
        this.add_time_btn.addListener(BtnEventType.OnTouchTap, this._onAddTimeBtnClick, this);

        UIMgr.Ins.addListener(UIEventType.Close, this._onResultViewClose, this);
    }

    protected removeEvents(): void {
        super.removeEvents();
        this.button_touch.removeListener(BtnEventType.OnTouchStart, this.onTouch, this);
        this.start_btn.removeListener(BtnEventType.OnTouchTap, this.onStart, this);
        this.skip_btn.removeListener(BtnEventType.OnTouchTap, this._onSkipBtnClick, this);
        this.add_time_btn.removeListener(BtnEventType.OnTouchTap, this._onAddTimeBtnClick, this);

        UIMgr.Ins.removeListener(UIEventType.Close, this._onResultViewClose, this);
    }

    public updateView(arg?: any): void {
        super.updateView(arg);

        let clientConfig = '[[[1,3000,0],[2,3000,1],[3,2000,2],[4,2000,4],[5,0,8],[6,0,16],[7,0,32],[8,0,64],[9,0,128]],[[""]],600,[1,2],1000]';
        this._info = [0, 0, 0, JSON.parse(clientConfig)];

        this.initScaleSize();

        this._score = 0;
        this._is_creating = false;
        this._is_gaming = false;
        this._is_end = false;
        this._is_send = false;

        this._fruit_current = undefined;
        this._fruit_next = undefined;
        this._fruit_count = 0;

        this.skip_btn.node.active = false;

        this.openViewClear();
        this.openViewTaskPart();
        this.openViewRenLine();
        this.openViewTip();
        this.updateScore();
        this.initFruitPool();
        this.showRemainingGameTime();
    }

    // 初始化缩放后的图片大小
    private initScaleSize() {
        this._fruit_scale_size = [];
        for (let i = 0; i < this._fruit_size.length; i++) {
            let sz = this._fruit_size[i];
            this._fruit_scale_size.push(sz * (this._fruit_scale_f + i * this._fruit_scale_c));
        }
    }

    // 开启界面时再调用清理相关操作
    private openViewClear() {
        this.clearTimer();
        this.clearFruit();
        this.clearRedLineTween();
    }

    // 开启界面时更新说明显示
    private openViewTaskPart() {
        this.preview_info_node.active = true;
    }

    // 开启界面时显示最高分数
    private openViewTip() {
        this.score_node_h.active = true;
        this.score_node.active = false;
        this.score_lb_h.string = this.getBestScore().toString();
    }

    private showRemainingGameTime() {
        let raw = cc.sys.localStorage.getItem(MainGameView.REMAINING_TIME_CACHE_KEY);
        let time = Number(raw);

        if (time === undefined) {
            time = 1;
            this.saveRemainingGameTime(time);
            return;
        }

        this._remaining_time = time;
        this.remaining_time_lb.string = `剩余次数：${this._remaining_time}`;
    }

    private saveRemainingGameTime(time: number) {
        cc.sys.localStorage.setItem(MainGameView.REMAINING_TIME_CACHE_KEY, time.toString());
        this.showRemainingGameTime();
    }

    /* ---------- ---------- 游戏流程 Part Begin ---------- ---------- */


    // 点击开始按钮
    private onStart() {
        if (this._remaining_time <= 0) {
            PopMgr.Ins.show("剩余次数不足");
            return;
        }
        this.saveRemainingGameTime(--this._remaining_time);

        this._is_gaming = true;
        this.preview_info_node.active = false;

        this.score_node_h.active = false;
        this.score_node.active = true;

        this.skip_btn.node.active = true;

        this.initGame();
    }
    // 初始化游戏
    private initGame() {
        this.initConfig();
        this.initFruit();
    }
    // 生成水果序列
    private initConfig() {
        let config: number[][] = this._info[3][0];
        let head: number[] = this._info[3][3];
        let total: number = this._info[3][4];

        this._fruit_config = [];

        for (let i = 0; i < head.length; i++) {
            this._fruit_config.push(head[i] - 1); // 代码里种类从 0 开始
        }

        for (let cnt = 0; cnt < total - head.length; cnt++) {
            let rand = RandomUtils.getRandomInt(1, 10000);
            for (let i = 0; i < config.length; i++) {
                if (rand <= config[i][1]) {
                    this._fruit_config.push(config[i][0] - 1);
                    break;
                }
                else {
                    rand -= config[i][1];
                }
            }
        }

    }
    // 生成顶部水果
    private initFruit() {
        let nowCount = this._fruit_count;

        let curId = this._fruit_config[nowCount];
        let nextId = this._fruit_config[nowCount + 1];

        if (curId != undefined && nextId != undefined) {

            if (this._fruit_current == undefined && this._fruit_next == undefined) {
                let curPos = this.line_node.y + 10 + this._fruit_scale_size[curId] / 2;
                let nextPos = curPos + this._fruit_scale_size[curId] / 2 + 10 + this._fruit_scale_size[nextId] / 2;
                this._fruit_current = this.createFruitOnPos(0, curPos, curId);
                this._fruit_next = this.createFruitOnPos(0, nextPos, nextId);
                this._is_creating = false;
            }
            else if (this._fruit_current == undefined) {
                let curPos = this.line_node.y + 10 + this._fruit_scale_size[curId] / 2;
                let nextPos = curPos + this._fruit_scale_size[curId] / 2 + 10 + this._fruit_scale_size[nextId] / 2;
                this._fruit_current = this._fruit_next;
                cc.tween(this._fruit_current)
                    .to(0.1, { position: cc.v3(0, curPos, 0) })
                    .call(() => {
                        this._is_creating = false;
                    })
                    .start();
                this._fruit_next = this.createFruitOnPos(0, nextPos, nextId);
                this._fruit_next.scale = 0;
                cc.tween(this._fruit_next).delay(0.1).to(.3, { scale: 1 }, { easing: cc.easing.backOut }).start();
            }
        }
        else if (curId != undefined) {

            if (this._fruit_current == undefined && this._fruit_next == undefined) {
                let curPos = this.line_node.y + 10 + this._fruit_scale_size[curId] / 2;
                this._fruit_current = this.createFruitOnPos(0, curPos, curId);
                this._is_creating = false;
            }
            else if (this._fruit_current == undefined) {
                let curPos = this.line_node.y + 10 + this._fruit_scale_size[curId] / 2;
                this._fruit_current = this._fruit_next;
                cc.tween(this._fruit_current)
                    .to(0.2, { position: cc.v3(0, curPos, 0) })
                    .call(() => {
                        this._is_creating = false;
                    })
                    .start();
            }
        }
        else {
            // 没有弹珠了 五秒后结算
            this._is_end = true;
            this._end_timer = TimeMgr.Ins.callLater(5, () => {
                this.gameEnd();
            });
        }

    }
    // 游戏中点击屏幕
    private onTouch(target: any, args: any[]) {
        // 还没开始游戏
        if (this._is_gaming == false) return;

        // 已经结束游戏
        if (this._is_end == true) return;

        // 正在创建水果
        if (this._is_creating == true) return;

        // 无等待下落的水果
        if (this._fruit_current == undefined) return;

        let fruit = this._fruit_current;
        this._fruit_current = undefined;
        this._fruit_count += 1;

        let { width, height } = this.button_touch.node;

        let eventTouch = args[0];
        let touchPos = eventTouch.getLocation();
        let pos = this.fruit_content_node.convertToNodeSpaceAR(touchPos);

        this._is_creating = true;
        let action = cc.sequence(cc.moveBy(0.1, cc.v2(pos.x, 0)).easing(cc.easeCubicActionIn()), cc.callFunc(() => {

            this.startFruitPhysics(fruit);
            fruit.getComponent(MainGameFruitItem).checkRedLine(this.line_node.y);

            this._creat_timer = TimeMgr.Ins.callLater(0.5, () => {
                this.initFruit();
            });
        }));

        fruit.runAction(action);
    }
    // 开启物理碰撞
    private startFruitPhysics(fruit) {
        fruit.getComponent(cc.RigidBody).type = cc.RigidBodyType.Dynamic;
        let collider = fruit.getComponent(cc.PhysicsCircleCollider);
        collider.radius = fruit.height / 2;
        collider.apply();
    }
    // 相同种类水果碰撞回调
    private onSameFruitContact({ self, other }) {
        other.node.off('CollideEvent');
        self.node.off('CollideEvent');

        let id = other.getComponent(MainGameFruitItem).id;

        let nextId = id + 1;
        if (nextId < this._fruit_name.length) {

            // 计算中心位置
            let x1 = self.node.x;
            let y1 = self.node.y;
            let x2 = other.node.x;
            let y2 = other.node.y;
            let x = (x1 + x2) / 2;
            let y = (y1 + y2) / 2;

            // 搁置两个节点（加入对象池）
            this.shelveFruit(self.node);
            this.shelveFruit(other.node);

            // 产生爆炸效果
            this.createFruitJuice(nextId, cc.v2({ x, y }), other.node.width);

            // 生成新节点并开启物理
            TimeMgr.Ins.callFew(() => {
                let newFruit = this.createFruitOnPos(x, y, nextId);
                this.startFruitPhysics(newFruit);
                newFruit.getComponent(MainGameFruitItem).checkRedLine(this.line_node.y);

                // 缓动效果
                newFruit.scale = 0;
                cc.tween(newFruit).to(.5, { scale: 1 }, { easing: cc.easing.backOut }).start();

                this._score += this._info[3][0][nextId][2];
                this.updateScore();
            });

            // if (nextId >= (this._fruit_name.length - 2)) {
            //     // 合成大西瓜后进入主游戏
            //     this._is_end = true;
            //     setTimeout(() => {
            //         this.gameEnd(true);
            //     }, 2000);
            // }
        }
    }
    // 产生爆炸效果
    private createFruitJuice(id, pos, size) {
        // 展示动画
        let boom = cc.instantiate(this.boom_eff);
        this.eff_node.addChild(boom);
        boom.active = true;

        boom.setPosition(pos);
        boom.scale = size / boom.width;
        let sp = boom.getComponent(GameSpine);
        sp.play("ui_daxigua_1", false, true);
        sp.setCompleteListener(() => {
            boom.destroy();
        });
    }



    /* ---------- ---------- 创建水果 Part Begin ---------- ---------- */

    // 根据类型创建水果 id >= 0
    private createOneFruit(id) {
        let fruit = this._fruit_pool.pop() ?? cc.instantiate(this.fruit_prefab);
        this.fruit_content_node.addChild(fruit);
        fruit.active = true;

        fruit.getComponent(MainGameFruitItem).setData({
            id: id,
            source: `mainGame/ui/auto/fruit_${this._fruit_name[id]}_shuimo`,
            size: this._fruit_scale_size[id],
            hasFun: false,
            hasContact: false
        });

        fruit.getComponent(cc.RigidBody).type = cc.RigidBodyType.Static;
        fruit.getComponent(cc.PhysicsCircleCollider).radius = 0;

        fruit.on('CollideEvent', this.onSameFruitContact.bind(this));
        fruit.on('RedLineEvent', this.onRedLineEvent.bind(this));

        return fruit;
    }
    // 在指定位置创建水果 id >= 0
    private createFruitOnPos(x, y, id) {
        let fruit = this.createOneFruit(id);
        fruit.setPosition(cc.v2(x, y));
        return fruit;
    }
    // 加入对象池
    private shelveFruit(fruit: cc.Node) {
        fruit.off('CollideEvent', this.onSameFruitContact.bind(this));
        fruit.off('RedLineEvent', this.onRedLineEvent.bind(this));
        fruit.removeFromParent(true);
        fruit.active = false;
        fruit.getComponent(MainGameFruitItem).stopCheckRedLine();
        this._fruit_pool.push(fruit);
    }
    // 清除在场水果  关闭界面 使用
    private clearFruit() {
        if (this.fruit_content_node) {
            this.fruit_content_node.children.forEach((fruit) => {
                fruit.off('CollideEvent', this.onSameFruitContact.bind(this));
                fruit.off('RedLineEvent', this.onRedLineEvent.bind(this));
                fruit.active = false;
                fruit.getComponent(MainGameFruitItem).stopCheckRedLine();
                this._fruit_pool.push(fruit);
            });
            this.fruit_content_node.removeAllChildren();
        }
        this._fruit_pool.forEach((node) => {
            node.destroy();
        });
        this._fruit_pool.length = 0;
    }


    /* ---------- ---------- 红线 Part Begin ---------- ---------- */

    // 触碰红线
    private onRedLineEvent() {
        this._is_end = true;

        this.fruit_content_node.children.forEach((node) => {
            node.getComponent(cc.RigidBody).type = cc.RigidBodyType.Static;
        });

        cc.tween(this.line_node)
            .to(0.5, { opacity: 30 })
            .to(0.5, { opacity: 255 })
            .to(0.5, { opacity: 30 })
            .to(0.5, { opacity: 255 })
            .call(() => {
                this.gameEnd();
            })
            .start();
    }
    // 关闭页面移除红线tween
    private clearRedLineTween() {
        cc.Tween.stopAllByTarget(this.line_node);
    }
    // 打开页面重制红线透明度
    private openViewRenLine() {
        this.line_node.opacity = 255;
    }


    /* ---------- ---------- 小东西 Part Begin ---------- ---------- */

    // 开启重力效果和碰撞效果  初始化 使用
    private initPhysics() {
        let instance = cc.director.getPhysicsManager()
        instance.enabled = true
        instance.gravity = cc.v2(0, -960);

        let collisionManager = cc.director.getCollisionManager();
        collisionManager.enabled = true
    }

    // 初始化对象池
    private initFruitPool() {
        for (let i = 0; i < this._fruit_name.length; i++) {
            let fruit = cc.instantiate(this.fruit_prefab);
            fruit.getComponent(MainGameFruitItem).setData({
                id: i,
                source: `mainGame/ui/auto/fruit_${this._fruit_name[i]}_shuimo`,
                size: this._fruit_scale_size[i],
                hasFun: false,
                hasContact: false
            });
            this._fruit_pool.push(fruit);
        }
    }

    // 更新分数显示  开启界面 增加分数 使用
    private updateScore() {
        this.score_lb.string = `${this._score}`;
    }


    // 清除所有计时器  关闭界面 使用
    private clearTimer() {
        if (this._creat_timer) {
            TimeMgr.Ins.remove(this._creat_timer);
            this._creat_timer = undefined;
        }
        if (this._end_timer) {
            TimeMgr.Ins.remove(this._end_timer);
            this._end_timer = undefined;
        }
    }

    // 结算本局游戏 
    private _onSkipBtnClick(): void {
        // this.close();
        this.gameEnd(false);
    }

    private _onAddTimeBtnClick(): void {
        this._remaining_time++;
        this.saveRemainingGameTime(this._remaining_time);
    }

    // 游戏结束发送消息
    private gameEnd(enterMainGame = true) {
        if (this._is_send == true) return;
        this._is_send = true;

        let param: IMainGameResultViewData = {
            num: this._score,
            enterMainGame: enterMainGame
        }
        UIMgr.Ins.open(MainGameResultView, UILayerType.View, param);
        this.saveBestScore(this._score);
    }

    private getBestScore(): number {
        let raw = cc.sys.localStorage.getItem(MainGameView.HIGHEST_SCORE_CACHE_KEY);
        let score = Number(raw || 0);
        if (!Number.isFinite(score)) {
            return 0;
        }
        return Math.max(0, Math.floor(score));
    }

    private saveBestScore(score: number): void {
        let bestScore = Math.max(this.getBestScore(), Math.floor(score || 0));
        cc.sys.localStorage.setItem(MainGameView.HIGHEST_SCORE_CACHE_KEY, `${bestScore}`);
        this.score_lb_h.string = `${bestScore}`;
    }

    private _onResultViewClose(target: UIMgr, args: [string]): void {
        let className = args[0];
        if (className && className == ClassUtils.getClassName(MainGameResultView)) {
            this.updateView();
        }
    }

    protected onClose(): void {
        super.onClose();
        this.clearTimer();
        this.clearFruit();
        this.clearRedLineTween();
    }
}