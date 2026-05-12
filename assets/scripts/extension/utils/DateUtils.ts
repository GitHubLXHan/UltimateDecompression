export class DateUtils {
    /**
     * static getNowDateString
     :string*/
    public static getNowDateString(): string {
        let date = new Date();
        return date.getFullYear() + "/" + date.getMonth() + "/" + date.getDay() + "/" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + " — " + date.getMilliseconds();
    }


    public static formatTime(t: number, fmt:string):string{

        let date = new Date(t);
        var o = { 
            "M+" : date.getMonth()+1,                 //月份 
            "d+" : date.getDate(),                    //日 
            "h+" : date.getHours(),                   //小时 
            "m+" : date.getMinutes(),                 //分 
            "s+" : date.getSeconds(),                 //秒 
            "q+" : Math.floor((date.getMonth()+3)/3), //季度 
            "S"  : date.getMilliseconds()             //毫秒 
        }; 
        if(/(y+)/.test(fmt)) {
            fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length)); 
        }
         for(var k in o) {
            if(new RegExp("("+ k +")").test(fmt)){
                 fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
             }
         }
        return fmt;
    }

    public static getFormatBySecond2(t: number = 0): string {
        if (t > 0) {
            // let y = Math.floor(t / 31536000);
            // t -= y * 31536000;
            let d = Math.floor(t / 86400);
            t -= d * 86400;
            let h = Math.floor(t / 3600);
            t -= h * 3600;
            let m = Math.floor(t / 60);
            t -= m * 60;
            // if (y > 0) {
            //     return `${y}年${d}天${h}小时`
            // } else 
            if (d > 0) {
                return i18n`${d}天${h}时`
            } else if (h > 0) {
                return i18n`${h}时${m}分`
            } else if (m > 0) {
                return i18n`${m}分`
            } else {
                return i18n`小于1分钟`
            }
        } else {
            return i18n`0天0小时`
        }
    }
}