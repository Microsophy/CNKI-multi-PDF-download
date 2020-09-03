// ==UserScript==
// @name         知网批量下载PDF+
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  用于知网批量下载PDF，保存下载信息到txt
// @author       Juicpt(因为不熟悉js里的属性方法，为了方便添加新功能，24用jQuery重写)
// @match        *://*.cnki.net/*
// @include      *://*.cnki.net.*
// @include      *://*/cnki.net/*
// @run-at       document-end
// @grant        unsafeWindow
// ==/UserScript==
var $ = unsafeWindow.jQuery;
(function(){
    // 插入『批量下载』和『信息』按钮，添加click事件
    if ($('.SavePoint')){
        $('.SavePoint').width(600);
        $('<a>批量下载PDF</a>').appendTo('.SavePoint').click(downLoad).attr({'id':'pdfdown','title':'此页面若有勾选，则下载勾选部分；没有则默认下载当前页面全部搜索结果'});
        $('<a>信息</a>').appendTo('.SavePoint').click(getInfo).attr({'id':'info','title':'导出简要信息，用于核对下载情况和辅助重命名'});
    }
    // 如果有资源，将caj下载链接替换成pdf
    if ($('tr[bgcolor]')){
        var tr = $('tr[bgcolor]');
        tr.each(function(){
            var url = $(this).find('a.briefDl_D,.briefDl_Y').attr('href');
            if (url){
                url = url.match('&dflag') ? url.replace('&dflag=nhdown','&dflag=pdfdown') : (url + '&dflag=pdfdown');
                $(this).find('a.briefDl_D,.briefDl_Y').attr('href',url);
            }
        });
    }
    // 收集标题、第一作者、发表时间等信息
    function getInfo(){
        var info = '序号→发表时间→第一作者→文献标题→页数／下载状态\n' ;
        var trselected = selectBox(tr);
        info += trselected.map(getInfoInEach).get().join('');
        var txtname = $('tr[bgcolor]').find('a.fz14,.author_flag').find('font.Mark').eq(0).text().trim() + '.txt';
        exportInfo(info,txtname);
    }
    // 下载当页内容
    function downLoad(){
        var trselected = selectBox(tr);
        trselected.each(function(){
            var bdown=$(this).find('a.briefDl_D,.briefDl_Y')[0];
            if (bdown) bdown.click();
        });
    }
    // 获取信息（子）
    function getInfoInEach(index){
        var pnum = index + 1;
        var ptime = $(this).find('td').eq(4).text().trim().substr(0,10);
        var pname = $(this).find('.author_flag').text().split(';')[0].trim().split('  ').pop();
        pname = pname.length > 10 ? pname.split(' ')[1] : pname
        var ptitle = $(this).find('a.fz14').text().trim().replace(/[\/:*?"<>|\s]+/g,'_');
        var pstatus = $(this).find('a.briefDl_D,.briefDl_Y').attr('title');
        pstatus = pstatus===undefined ? '未下载': pstatus.slice(3);
        var infoineach = pnum + '→' + ptime + '→' + pname + '→' + ptitle + '→' + pstatus + '\n' ;
        return infoineach;
    }
    // 检查勾选状态
    function checkBox(){
        var checkstatus = 0;
        tr.each(function(){
            if ($(this).find(':checkbox').attr('checked')==true )
            {
                checkstatus =1;
                return false;
            }
        });
        return checkstatus;
    }
    // 筛选操作对象
    function selectBox(all){
        var checked = checkBox();
        var selected = checked == 1 ? all.filter(function(){return $(':checkbox',this).attr('checked')==true}) : all
        return selected
    }
    // 保存信息为txt
    function exportInfo(content, filename) {
        // 创建隐藏的可下载链接
        var eleLink = document.createElement('a');
        eleLink.download = filename;
        eleLink.style.display = 'none';
        // 字符内容转变成blob地址
        var blob = new Blob([content]);
        eleLink.href = URL.createObjectURL(blob);
        // 触发点击
        document.body.appendChild(eleLink);
        eleLink.click();
        // 然后移除
        document.body.removeChild(eleLink);
    }
})();
