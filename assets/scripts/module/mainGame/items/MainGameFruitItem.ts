
import { BaseComponent } from "../../../extension/components/BaseComponent";
import { GameSprite } from "../../../extension/game/GameSprite";

const { ccclass, property } = cc._decorator;

export interface IMainGameFruitItemData {
    id: number;
    source: string;
    size: number;
    hasFun: boolean;
    hasContact: boolean;
}

@ccclass
export class MainGameFruitItem extends BaseComponent {
    @property(GameSprite)
    public fruit_img: GameSprite = undefined;

    id = 0;
    hasFun = false;
    hasContact = false;

    private _data: IMainGameFruitItemData;

    public get data(): IMainGameFruitItemData {
        return this._data;
    }

    public set data(data: IMainGameFruitItemData) {
        this.setData(data);
    }

    public setData(data: IMainGameFruitItemData): void {
        if (!data) return;
        this._data = data;

        this.id = data.id;
        this.fruit_img.source = data.source;
        this.node.width = this.node.height = data.size;
        this.hasFun = data.hasFun;
        this.hasContact = data.hasContact;
    }

    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (self.node && other.node) {
            let s = self.node.getComponent(MainGameFruitItem);
            let o = other.node.getComponent(MainGameFruitItem);
            if (s && (o?.hasContact || other.node.name == 'ground_1')) {
                this.hasContact = true; // 与水果发生碰撞
            }
            if (!this.hasContact) return;

            if (s && o && s.id == o.id && s.hasFun == false && o.hasFun == false) {
                s.hasFun = true;
                o.hasFun = true;
                self.node.emit('CollideEvent', {self, other});
            }
        }
    }

    isTouchRenLine(targetY: number) {
        if (this.hasContact == true && this.node.y + this.node.height / 2 > targetY) {
            this.node.emit('RedLineEvent');
        }
    }

    // 3 秒后判断是否压红线
    checkRedLine(targetY: number) {
        this.scheduleOnce(() => {
            this.isTouchRenLine(targetY);
        }, 3);
    }

    stopCheckRedLine() {
        this.unschedule(this.isTouchRenLine);
    }
}