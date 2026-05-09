/*
 * @Author: yg
 * @Date: 2022/11/23
 * @Description: 合成西瓜小游戏水果item
 */

import { BaseComponent } from "../../../extension/components/BaseComponent";
import { GameSprite } from "../../../extension/game/GameSprite";

const { ccclass, property } = cc._decorator;

export interface IWatermelonMinGameViewFruitItemData {
    id: number;
    source: string;
    size: number;
    hasFun: boolean;
    hasContact: boolean;
}

@ccclass
export class WatermelonMinGameViewFruitItem extends BaseComponent {
    @property(GameSprite)
    public fruitImg: GameSprite = undefined;

    id = 0;
    hasFun = false;
    hasContact = false;

    private _data: IWatermelonMinGameViewFruitItemData;

    public get data(): IWatermelonMinGameViewFruitItemData {
        return this._data;
    }

    public set data(data: IWatermelonMinGameViewFruitItemData) {
        this.setData(data);
    }

    public setData(data: IWatermelonMinGameViewFruitItemData): void {
        if (!data) return;
        this._data = data;

        this.id = data.id;
        this.fruitImg.source = data.source;
        this.node.width = this.node.height = data.size;
        this.hasFun = data.hasFun;
        this.hasContact = data.hasContact;
    }

    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (self.node && other.node) {
            let s = self.node.getComponent(WatermelonMinGameViewFruitItem);
            let o = other.node.getComponent(WatermelonMinGameViewFruitItem);
            if (s && (o?.hasContact || other.node.name == 'Ground1')) {
                this.hasContact = true; // 与水果发生碰撞
            }
            if (!this.hasContact) return;

            if (s && o && s.id == o.id && s.hasFun == false && o.hasFun == false) {
                s.hasFun = true;
                o.hasFun = true;
                self.node.emit('sameContact', {self, other});
            }
        }
    }

    isTouchRenLine(targetY: number) {
        if (this.hasContact == true && this.node.y + this.node.height / 2 > targetY) {
            this.node.emit('touchRedLine');
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