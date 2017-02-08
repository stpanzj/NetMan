// version 5

//----------- find val of index in arr, return ptr /null
function fGetPtr(arr, index, val){
	for (var i = 0; i<arr.length; i++){
		if (arr[i][index]==val) {return arr[i]}
	}
	return null;
}
//------- copy Object/Array contains Object, Array, Number and String-
var fcopyOneCell = function(source) {
	if (Object.prototype.toString.call(source)==='[object Array]') {
		var result = new Array();
		var isArray = true;
	} else {
		var result = new Object();
		var isArray = false;
	}
	for (var key in source) {
		if (isArray) {
			result.push(fcopyOneCell(source[key]));
		} else {
			if ((Object.prototype.toString.call(source[key])==='[object Object]')||
				(Object.prototype.toString.call(source[key])==='[object Array]')) {
				result[key] = fcopyOneCell(source[key]);
			} else { 
				result[key] = source[key];
			}	
		}
   }
   return result;
}
//-------------Same as fcopyOneCell--------- 
function copyOneCell(source,target) {
	if (typeof(target) == 'undefined'){
		if (Object.prototype.toString.call(source)==='[object Array]') {
			target = new Array();
		} else {
			target = new Object();
		}
	}
	
	for (var key in source) {
		switch (Object.prototype.toString.call(source[key])) {
		case '[object Object]':
			target[key] = new Object();
			copyOneCell(source[key],target[key]);
			break;
		case '[object Array]':
			target[key]=[];
			copyOneCell(source[key],target[key]);
			break;
		default:
			target[key] = source[key];
		}
	}
}
//-----------坐标变换------把数据中全部坐标从国标坐标改为百度坐标
function fGCJ02_BD09(cell){
	for (var i=0; i<cell.length; i++){
		if (typeof(cell[i].position)!="undefined"){  //有point数据
			cell[i].position = Convert_GCJ02_To_BD09(cell[i].position.lng,cell[i].position.lat);
		}
		if (typeof(cell[i].outbounds)!="undefined"){
			for (var j=0; j<cell[i].outbounds.length; j++){
				cell[i].outbounds[j] = Convert_GCJ02_To_BD09(cell[i].outbounds[j].lng,cell[i].outbounds[j].lat);
			}
		}
  	}
}
//-----把全部坐标从百度坐标转为国标
function fBD09toGCJ02(cells){
	for (var i=0; i<cells.length; i++){
		if (typeof(cells[i].position)!="undefined"){  //有point数据
			cells[i].position = Convert_BD09_To_GCJ02(cells[i].position.lng,cells[i].position.lat);
//			cells[i].position.lng = cells[i].position.lng.toFixed(6);
//			cells[i].position.lat = cells[i].position.lat.toFixed(6);
		}
		if (typeof(cells[i].outbounds)!="undefined"){
			for (var j=0; j<cells[i].outbounds.length; j++){
				cells[i].outbounds[j] = Convert_BD09_To_GCJ02(cells[i].outbounds[j].lng,cells[i].outbounds[j].lat);
			}
		}
  	}
}
// 中国国标加密GCJ02转到百度加密坐标BD09
function Convert_GCJ02_To_BD09(lng,lat){
	var x = lng, y = lat;
	var z =Math.sqrt(x*x + y*y) + 0.00002 * Math.sin(y * Math.PI * 3000.0 / 180.0);
	var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * Math.PI * 3000.0 / 180.0);
	var bdLon = z * Math.cos(theta) + 0.0065;  
	var bdLat = z * Math.sin(theta) + 0.006; 
	return {'lat' : bdLat,'lng' : bdLon};
}
// 百度坐标转GCJ
function Convert_BD09_To_GCJ02(lng,lat){
	var x = lng - 0.0065, y = lat - 0.006;
	var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * Math.PI * 3000.0 / 180.0);
	var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * Math.PI * 3000.0 / 180.0);
	var gcjLon = z * Math.cos(theta);
	var gcjLat = z * Math.sin(theta);
	return {'lat' : gcjLat, 'lng' : gcjLon};
}
// 长度介于len1和len2（含）的两个点，返回true
function fSamePosition(point1,point2,len1,len2){
	var y = Distance(point1.lng, point1.lat, point2.lng, point2.lat);
	if ((y >= len1)&&(y <= len2)) {return true}
	return false;
}
// 输出米为单位的距离，坐标系是何种影响不大。
function Distance(lng1,lat1,lng2,lat2){
	var radLat1 = lat1 * Math.PI / 180.0, radLat2 = lat2 * Math.PI / 180.0;
	var a = radLat1 - radLat2;
	var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
	var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) +
		Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
	s = s * 6378.137 * 1000;
 	s = Math.round(s * 10000) / 10000;
	return s;
}
//--------------------------------------------
function leave(){
	if (vDataSave){
		alert('wait!');
	}
}

//-------------------- 初始化
function initialize() {
//生成地图
	vMap = new AMap.Map(document.getElementById("MapWindow"),{
		scrollWheel:true,
		showBuildingBlock:false,
	});
	if (!vMap) { 
		alert('无法连接高德地图！');
		return;
	}
	vMap.on('rightclick',fRightClick);
	vMap.on('click',fClick);
	vMap.on('zoomend',function(){
		if (!myLock.noredraw) {
			fClearAndDraw(vMap,vCurFCells,vCurCCells,vCurFatherID,false);
		}
		if (myShowWindows.length !=0)
			fShowInfoWindow(vMap,myShowWindows[myShowWindows.length-1]);
	});
	vMap.on('moveend',function(){
		if (!myLock.noredraw) {
			fClearAndDraw(vMap,vCurFCells,vCurCCells,vCurFatherID,false);
		}
		if (myShowWindows.length !=0)
			fShowInfoWindow(vMap,myShowWindows[myShowWindows.length-1]);
	});

	mySatMap = new AMap.TileLayer.Satellite({map:vMap});
	mySatMap.hide();
//	myBuildingsMap = new AMap.Buildings();
//	myBuildingsMap.setMap(vMap);	
//生成各种Icon
// 编辑icon
	vIconEditing = new AMap.Marker().getIcon();
	
	//生成ICON存入BSicons
	for (var i=0; i<BSicons.length; i++){
		BSicons[i].icon = new AMap.Icon({
			image:BSicons[i].iConUrl,
			size: new AMap.Size(20,20),
			imageOffset: new AMap.Pixel(0, 0), 
			imageSize: new AMap.Size(20,20)});
	}
	
	//生成网元类型的中心点ICON
	for (var i=0; i<deftype.length; i++){
		deftype[i].icon = new AMap.Icon({
			image: deftype[i].iConUrl,
			size: new AMap.Size(deftype[i].x,deftype[i].y),
			imageOffset: new AMap.Pixel(0, 0),
			imageSize: new AMap.Size(deftype[i].x,deftype[i].y)});
	}

//构造通用信息窗口。
	myInfoWindow = new AMap.InfoWindow({
		isCustom:true, autoMove:false,
	});

//工具窗口，配置五个按键
	$("#iToolsLeft").unbind('click').click(fMoveLeft);
	$("#iToolsRight").unbind('click').click(fMoveRight);
	$("#iToolsUp").unbind('click').click(fMoveUp);
	$("#iToolsDown").unbind('click').click(fMoveDown);
	$("#iToolsRuler").unbind('click').click(fRuler);

//生成画图工具drawing tools on the map，与测距合用
	vMap.plugin(["AMap.MouseTool"],function(){
    	vDrawingManager = new AMap.MouseTool(vMap);
	});
	myLock.ruler = false;
// 构造处理菜单
	fGenMenu();
//---用初始化数据先画出
	vDataAdded=fcopyOneCell(vIniData);
	vDataAppendMode = 'new';
	fLoadDataAndShow(vDataAdded,vDataAppendMode,true);
}

//------ map moving
function fMoveDown(){
	fMoveMap(vMap,'down')
}
function fMoveLeft(){
	fMoveMap(vMap,'left')
}
function fMoveUp(){
	fMoveMap(vMap,'up')
}
function fMoveRight(){
	fMoveMap(vMap,'right')
}
function fMoveMap(map,dir){
	var mySize = map.getSize();
	var x=0, y=0;
	switch(dir){
		case 'left':
		x = -Math.round(88*mySize.width/100);
		break;
		case 'right':
		x = Math.round(88*mySize.width/100);
		break;
		case 'down':
		y = Math.round(98*mySize.height/100);
		break;
		case 'up':
		y = -Math.round(98*mySize.height/100);
		break;
	}
	map.panBy(x, y);
}
// ruler 打开，关闭在结束的linstener中。
function fRuler(){
	if (!myLock.ruler){	// 打开测距功能
		$('#iToolsRuler').val('测距...');
        vDrawingManager.rule();
		myLock.lock = true;
		myLock.ruler = true;
	} else {
		$('#iToolsRuler').val('测距');
        vDrawingManager.close(true);
		myLock.lock = false;
		myLock.ruler = false;
	}
}
// 将数据加入，并显示地图。输入数据input，加载模式 mode vDataAppendMode:vOrgData,vDataAdded->
function fLoadDataAndShow(input,mode){
	// 新数据格式转换
	switch(mode){
		case 'new':
		vOrgData = input;
		break;
		case 'append':
		fAppendJson(input.cells, vOrgData.cells, input.rootID, vCurFatherID);
		break;
		case 'supplement':
		fAddSupplementaryData(vOrgData.cells,input.cells);
		break;
	}
	fNewCurData(vOrgData, vOrgData.rootID);

	fClearAndDraw(vMap,vCurFCells,vCurCCells,vCurFatherID,true);
	if (fGetPtr(deftype,'val','12').exist){	//是基站
		myLock.lock = true;
		fDisplayBaseStations(new AMap.Pixel(0,0));
	}
}
function fAddSupplementaryData(source,supplement){
	var mySame = 0, myPos=0, myErrNum=0;
	for (var i=0; i<supplement.length; i++){
		mySame = 0;
		for (var j=0; j<source.length; j++){
			if (supplement[i].name==source[j].name){
				mySame++;
				if (mySame==1) myPos = j
			}
		}
		if (mySame == 1) {
			for (j in supplement[i]){
				if ((Object.prototype.toString.call(supplement[i].j)!='[object Object]')&&
					(Object.prototype.toString.call(supplement[i].j)!='[object Array]'))
					source[myPos][j] = supplement[i][j];
			}
		} else { 
			myErrNum ++;
			if (myErrNum<5)alert(mySame+supplement[i].name)
		}
	}
}
// 把src拷入tar。从根开始遍历所有的树叶，把父亲为rootID的拷贝至tar。新的父亲改为tarfatherid，ID重编。
function fAppendJson(srcJson,tarJson,rootID,tarfatherid){
	for (var i=0; i<srcJson.length; i++){
		if (srcJson[i].fatherID == rootID) {
			var tempcell = fcopyOneCell(srcJson[i]);
			tempcell.fatherID = tarfatherid;
			var j = fFindSamePositionCell(tarJson, 0, tempcell, 0, 10);

			if (j) {	
				tempcell.ID = j.ID;
				if (srcJson[i].type.slice(0,2)=='12'){	//'12':室外站址
					if (typeof j.devices =='undefined'){ j.devices = new Array();};
					for (var k=0; k<tempcell.devices.length; k++){
						for (var l=0; l<j.devices.length; l++){	
							if ((j.devices[l].system == tempcell.devices[k].system)&&(j.devices[l].subsys == tempcell.devices[k].subsys)) break;
						}
						if (l==j.devices.length) { j.devices.push(tempcell.devices[k]);}
					}
				}
			} else {
				tempcell.ID = vMaxID;
				vMaxID++;
				tarJson.push(tempcell);
			} 

			if (rootID!=srcJson[i].ID){
				vAppendJson(srcJson, tarJson, srcJson[i].ID, tempcell.ID);
			}
		}
	}
}
// type 12 =室外基站站址
// 从cells的start开始，位置差介于len1和len2的返回该基站的指针，没有返回null,type 是相同的类型才比较
function fFindSamePositionCell(cells,start,cell,len1,len2){
	var len;
	for (var i=start; i<cells.length; i++){
		if (cells[i].type.slice(0,2)==cell.type.slice(0,2)) {	// 不是同一类型的网元，不需比较
			len = fDistance(cell.position,cells[i].position);
			if ((len >= len1)&&(len <= len2)) return cells[i];
		}
	}
	return null;
}
// 两个对象{'lng','lat'}距离小于5米，认为是同一站址，返回true
function fDistance(point1,point2){
	return vMap.getDistance(new BMap.Point(point1.lng, point1.lat), new BMap.Point(point2.lng, point2.lat));
}
// 生成操作数据：输入数据源，生成相应的vCurFCells、vCurCCells、统计数据vMaxID，vCurFartherID等
// vCurFCells放框，下溯2层。
function fNewCurData(orgData, fatherid){
	// 生成vCurFCells,如果是行政区划，则包含下一级行政区划。
	// 生成vCurCCells，拷贝所有的儿孙，子孙不包括行政区划（解决行政区划的分层问题）。增加display、deleted参数
	// 生成vMaxID和vCurFatherID
    var vOrgCells = orgData.cells;
    vCurCCells = new Array();
    vCurFCells = new Array();
    myDataType = new Array();
    vMaxID = 0;

    for (var i=0; i<deftype.length; i++){
    	deftype[i].exist = false;
    }
    
 	for (var i= 0; i < vOrgCells.length; i++){
 		if (vMaxID < vOrgCells[i].ID) {vMaxID = vOrgCells[i].ID;};
 		if (typeof(vOrgCells[i].type)!='undefined'){	//统计类型
 			var j = fGetPtr(deftype,'val',vOrgCells[i].type.slice(0,2));
 			if (j) j.exist = true;
 		}

        if (vOrgCells[i].ID == fatherid) vCurFCells.push(fcopyOneCell(vOrgCells[i]));

        if (vOrgCells[i].fatherID == fatherid) {
        	if (vOrgCells[i].type == '31'){	// 该区划的儿子也要copy，孙子不用
        		vCurFCells.push(fcopyOneCell(vOrgCells[i]));
        		for (k=0; k<vOrgCells.length; k++){
        			if (vOrgCells[k].fatherID==vOrgCells[i].ID&&vOrgCells[k].type!='31')
        				vCurCCells.push(fcopyOneCell(vOrgCells[k]));
        		}
        	} else {
        		vCurCCells.push(fcopyOneCell(vOrgCells[i]));
        	}
        	//fcopyDescendants(vOrgCells, vCurCCells, vOrgCells[i].ID);	//不拷贝子孙为行政区划的单元
        }
    }
    vMaxID++;
    vCurFatherID = fatherid;
    for (var i=0; i<vCurFCells.length; i++){
    	vCurFCells[i].deleted = false;
    	vCurFCells[i].display = true;
    }
    for (var i=0; i<vCurCCells.length; i++){
    	vCurCCells[i].deleted = false;
    	vCurCCells[i].display = true;
    }
    // 重置vDataChanged
    if (vDataAppendMode == 'new'){
    	vDataChanged = false;
    	vDataSave = false;
    }
    if (vDataAppendMode == 'append'||vDataAppendMode == 'supplement'){
    	vDataChanged = false;
    	vDataSave = true;
    }

}

// 把souce中id的子孙copy到target中。不拷贝子孙为行政区划的单元
function fcopyDescendants(source,target,id){
	for (var i=0; i<source.length; i++){
		if (source[i].fatherID == id){
			if (source[i].type !='31'){
				target.push(fcopyOneCell(source[i]));
			}
			fcopyDescendants(source, target, source[i].ID);
		}
	}
}

//------在地图上画出各种网元
//------------------- 清除原来map上显示内容，用fatherCells画框，用childrenCells画各网元,用thisfatherid做视野。
function fClearAndDraw(map,fatherCells,childrenCells,thisfatherid,center){
	// Clear view
	for (var i=0; i<vaPtrCellDisplayed.length; i++){
  		if (vaPtrCellDisplayed[i].outbound) vaPtrCellDisplayed[i].outbound.setMap();
  		if (vaPtrCellDisplayed[i].center) vaPtrCellDisplayed[i].center.setMap();
  		if (vaPtrCellDisplayed[i].circle) vaPtrCellDisplayed[i].circle.setMap();
  	}
  	vaPtrCellDisplayed = new Array();
	var gocenter=false;  	
	// Drawing: bounds
	for (var i=0; i<fatherCells.length; i++){
		if (fatherCells[i].deleted) continue;
		gocenter = (fatherCells[i].ID == thisfatherid);
		fDrawCell(map, fatherCells[i], center&&gocenter, gocenter&&true);	// 当需要居中时，必须是father节点才居中
	}
	// Drawing: Element 只有在14级以上的图才显示，且每次只显示当前视图的单元
	var myBounds = map.getBounds();
	vMapZoom = map.getZoom();
	$('#iToolsZoom').text(vMapZoom.toString());
	
	for (var i=0; i<childrenCells.length; i++){
		if (childrenCells[i].display&& !childrenCells[i].deleted)
			if (vMapZoom > myZoom) 
				if (myBounds.contains(new AMap.LngLat(childrenCells[i].position.lng, childrenCells[i].position.lat)))
					fDrawCell(map, childrenCells[i], false, false);
	}

}
//------------ 画一个网元:center指polygon是否居中，color指polygon是否要用特殊颜色
function fDrawCell(map, cell, center, color){
// 在指定的map上根据json指定的cell单元画出该cell。
// cell 由边界，中心点，覆盖范围和相关动作组成，并新增三个数组跟踪每个cell。
// 边界和覆盖范围取一，各加入Listener处理左右键。
// draw the cell, add listener，是边界按边界处理
	if (cell == null) return false;
	if (!cell.display) return false;
	var iDisplayed = new Object({id:cell.ID, cellptr:cell, center:null,outbound:null,cover:null,label:null});
	vaPtrCellDisplayed.push(iDisplayed);

	var myPoint = null;
	// 生成Mark
	if (typeof(cell.position) != 'undefined'){
		myPoint = new AMap.LngLat(cell.position.lng,cell.position.lat);
		
		var myIcon = null;
		if (cell.type.slice(0,2) == "12"){	//用站址进展,icon编号用0-3位，0为站址，1为2/3G，2为1800M/2100M，3为LTE
			var myIconOrder=0;
			var e1=false, e2=false, e3=false;	// 规划、建成
			var n1=false, n2=false, n3=false;	// 没有
			var j = 0;	//站址

			j = parseInt(cell.type.slice(3,4));
			if (j < vPreDefProg.length ) {
				if (vPreDefProg[j].exist) {
					myIconOrder += 2;
				} else {
					myIconOrder += 1;
				}
			}
			for (var i=0; i<cell.devices.length;i++){
				j = parseInt(cell.devices[i].progress);
				if (!e1 &&(cell.devices[i].system =='3G'|| cell.devices[i].system =='2G')){
					if (j < vPreDefDProg.length) e1 = vPreDefDProg[j].exist;
					n1 = true;
				
				} else if (cell.devices[i].system =='4G'&&cell.devices[i].subsys=='800M'){
					if (j < vPreDefDProg.length) e3 = vPreDefDProg[j].exist;
					n3 = true;
				
				} else if (!e2){
					if (j < vPreDefDProg.length) e2 = vPreDefDProg[j].exist;
					n2 = true;
				}
			}

			if (n1){
				if (e1) {
					myIconOrder += 2*4;
				} else {
					myIconOrder += 1*4;
				}
			}
			if (n2){
				if (e2) {
					myIconOrder += 2*16;
				} else {
					myIconOrder += 1*16;
				}
			}
			if (n3){
				if (e3) {
					myIconOrder += 2*64;
				} else {
					myIconOrder += 1*64;
				}
			}

			var j = fGetPtr(BSicons,'id',myIconOrder);
			if (j) {
				myIcon = j.icon;
			} else {
				myIcon = BSicons[0].icon;
			}
		} else {
			myIcon = fGetPtr(deftype,'val',cell.type.slice(0,2)).icon;
		}

		iDisplayed.center = new AMap.Marker({map:map, position:myPoint, offset: new AMap.Pixel(-8,-8),icon: myIcon});
		iDisplayed.center.zIndex = cell.ID;
		if (cell.type.slice(0,2)=='31'&& vMapZoom > myZoom){
			iDisplayed.center.setLabel({content:cell.name, offset:new AMap.Pixel(-10,30)});
		}
	}
	

	// draw outbound
	if (typeof(cell.outbounds) != 'undefined'){
		var path= new Array();
		for (var i =0; i < cell.outbounds.length; i++) {
			path.push(new AMap.LngLat(cell.outbounds[i].lng, cell.outbounds[i].lat));
		}
		// drawing given cell's outline,重要:json中的ID写入block中
		// color_mode 0 for father, 1 for children, 2 for edit
		var color_mode = 1;
		if (color){ color_mode = 0;}
		iDisplayed.outbound = new AMap.Polygon({
			map:map,path:path,
			strokeColor:   colors[color_mode].strokeColor,
			strokeOpacity: colors[color_mode].strokeOpacity,
			strokeWeight:  colors[color_mode].strokeWeight,
			fillColor:     colors[color_mode].fillColor,
			fillOpacity:   colors[color_mode].fillOpacity
		});
		iDisplayed.outbound.zIndex = cell.ID;
		
		if (center){
			map.setBounds(fNewBounds(path));
			iDisplayed.outbound.zIndex = 1;
		}
	}

	// add 无线覆盖:draw, show and listener
	if ((cell.type.slice(0,2)=="12")&&(cell.devices.length>0)){
		var myRadius = 0, myType = 0, myLTE800 = 'solid', myLTE1800 = 1; // max
		for (var i=0; i<cell.devices.length;i++){
			var e = $("#BaseStations"+cell.devices[i].system+cell.devices[i].subsys).attr("checked") == "checked";
			if (e) {
				myRadius = cell.devices[i].radius;
				myType = cell.devices[i].progress;
			}
			if (cell.devices[i].system =='4G'&&cell.devices[i].subsys=='800M') { myLTE800 = 'dashed'}
			if (cell.devices[i].system =='4G'&&cell.devices[i].subsys=='1800M') { myLTE1800 = 3}
		}

		var myColor="grey";
		if (myType < vPreDefDProg.length) { myColor = vPreDefDProg[myType].color };

		iDisplayed.cover = new AMap.Circle({
			center:myPoint, radius:myRadius,
			strokeColor:myColor, strokeWeight:myLTE1800, strokeOpacity:1, strokeStyle:myLTE800, 
			fillColor:''});
		iDisplayed.cover.zIndex = cell.ID;
//		map.addOverlay(iDisplayed.cover);
	}

	if (iDisplayed.outbound){
		iDisplayed.outbound.on("rightclick", fRightClick);
		iDisplayed.outbound.on("click", fClick);
//		iDisplayed.outbound.addEventListener("mouseout", b_HideInfo);
	}

	if (iDisplayed.center){
		iDisplayed.center.on("rightclick", fRightClick);
		iDisplayed.center.on("click", fClick);
	}
//	if (iDisplayed.cover){
//		iDisplayed.cover.addEventListener("mouseout", fMoveout);
//	}
	
}
// 生成bounds，path是数组，对象{lng,lat}
function fNewBounds(path){
//(southWest, northEast)
	if (path.length <2) return null;
	var lngU=path[0].lng,lngD=lngU, latL=path[0].lat, latR=latL;

	for (var i=0; i<path.length; i++){
		if (path[i].lng > lngU) lngU = path[i].lng;
		if (path[i].lng < lngD) lngD = path[i].lng;
		if (path[i].lat < latL) latL = path[i].lat;
		if (path[i].lat > latR) latR = path[i].lat;
	}
	return new AMap.Bounds(new AMap.LngLat(lngD, latL), new AMap.LngLat(lngU,latR));
}
//-------------信息窗口类
//-----------显示基站统计信息，在屏幕的（x,y)处，左上为(0，0)
function fDisplayBaseStations(pixel){
	// 显示
	myLock.refress = false;
//	myLock.noredraw = true;
	fOpenBaseStationsWindow(vMap,myInfoWindow,pixel);
}

//-----鼠标操作：调用菜单和显示各种信息--------------------------------------
//-----------Right Click for Marker,Polygon and Circle, and on Map---------
function fRightClick(e){
	if (e.overlay) return; // 在覆盖物上点击，会同时触发地图的事件，要过滤
	if (myLock.menu) return;
	if (myLock.lock) return;

	myLock.curid = e.target.zIndex;
	myLock.celldisplay = fGetPtr(vaPtrCellDisplayed,'id',e.target.zIndex);
	myLock.type = '00';
	if (myLock.celldisplay) myLock.type = myLock.celldisplay.cellptr.type.slice(0,2);

	var ev = new jQuery.Event('contextmenu');
	if(e.clientX){
		ev.pageX = e.clientX;
		ev.pageY = e.clientY;
	}else if(e.pixel){
		ev.pageX = e.pixel.x;
		ev.pageY = e.pixel.y;
	}else if(e.Ja){
		ev.pageX = e.Ja.pageX;
		ev.pageY = e.Ja.pageY;	
	}else{
		var p = vMap.pointToPixel(e.lnglat);
		ev.pageX = p.x;
		ev.pageY = p.y;
		if(!ev.pageX) window.console ? console.error('Cursor position not found!') : alert('Cursor position not found!');
	}
	// contextMenuEvent = e;
	ev.lnglat = e.lnglat;
	ev.originalThis = this;

	$('#MapWindow').trigger(ev);
}
//-------Click for showing information about the cell--------------
//-------base station显示信息框-----------------------
function fClick(e){
	if (e.overlay) return; // 在覆盖物上点击也触发地图，要过滤
	if (e.target.CLASS_NAME=="AMap.Map" && myLock.noclick)	return;
	if (myLock.show){
		fCloseDisplayCell();
		myLock.show = false;
		return;
	}
	if (myLock.selectfather){
		var i = fGetPtr(vaPtrCellDisplayed,'id',e.target.zIndex);
		if (!i) return;
		myLock.selectfather = false;
		myLock.fatherid = e.target.zIndex;
		$('#CellFatherName').val(i.cellptr.name);
		return;
	}
	if (myLock.menu) return;
	if (myLock.lock) return;

	myLock.lock = true;
	myLock.show = true;
	
	myLock.celldisplay = fGetPtr(vaPtrCellDisplayed,'id',e.target.zIndex);
	var myType = '00';
	if (myLock.celldisplay) myType = myLock.celldisplay.cellptr.type.slice(0,2);

	switch(myType){
		case '00': //地图上,显示站点数
		fDisplayBaseStations({x:e.pixel.x,y:e.pixel.y});
		break;

		case '12': //室外基站站址
		default:
		fOpenCellWindow(vMap,myInfoWindow,{x:e.pixel.x,y:e.pixel.y},myLock.celldisplay.cellptr,
			'提示：网元信息',null,fCloseDisplayCell);
		break
	}
}
function fCloseDisplayCell(){
	myLock.lock = false;
	myLock.selectfather = false;
	myLock.show = false;
	fCloseInfoWindow();
}

function fMoveout(){
	if (myLock.show) {
		myLock.show = false;
		myLock.lock = false;
		var myType = '00';
		if (myLock.celldisplay) myType = myLock.celldisplay.cellptr.type.slice(0,2);
		switch(myType){
			case '12': //室外基站站址
		fCloseInfoWindow();
		break;
		}
	}
}
//------------生成弹出菜单			
function fGenMenu(){
	$(function() {
		$.contextMenu({  //e.eventName effected
			selector:'#MapWindow',
			trigger:"none",
			build: function($trigger, e) {
				myLock.x = e.pageX;
				myLock.y = e.pageY;
				switch(myLock.type){
					case '00': //click on map
					return {
					callback: function(key, options) {
						if(func[key]){func[key](options);} ; //if(func[key]){func();}  && func[key]()
					},
					items:{
						"new": {name:"新建网元", icon: "add"},
						"type": {name:"类型", icon:'add',type:'select',
							options:{11: '用户点', 12: '室外基站站址', 13: '室内分布站址',21:'管道',22:'光缆',
								23:'电路',31:'行政区划',32:'光网格',33:'网络节点'}, selected: "12"},
						"sep1": "---------",
						"editborder":{name:"编辑边界",icon: "cut"},
						'find':{name:'查找网元',icon:'find'},
						"sep2": "---------",
						"load": {name:"装入新文件",icon: "copy"},
						"add":{name:"添加数据", icon: "paste"},
						'supplement':{name:'补充数据'},
						"save": {name:"保存数据",icon: "quit"},
						"sep3": "---------",
						"SATELLITE":{name: "卫星图",type: 'checkbox',selected: false},
						'close': {name: "关闭菜单", callback: $.noop}
            		},
					events: eventsfun }

					case "12": //室外基站站址
					return {
					callback: function(key, options) {
						if(func[key]){func[key](options);} 
					},
					items:{	
						"edit": {name:"编辑本单元", icon: "edit"},
						"dele": {name:"删除本单元", icon: "delete"},
						"backup":{name:"备选基站"},
						'find':{name:'查找网元',icon:'find'},
						"sep1": "---------",
						"load": {name:"装入新文件",icon: "copy"},
						"add":{name:"添加数据", icon: "paste"},
						"save": {name:"保存数据",icon: "quit"},
						"sep2": "---------",
						"SATELLITE":{name: "卫星图",type: 'checkbox',selected: false},
						'close': {name: "关闭菜单", callback: $.noop}
					},
					events: eventsfun }

					case "31": //行政区划
					default:
					return {
					callback: function(key, options) {
						if(func[key]){func[key](options);} 
					},
					items:{	
						"edit": {name:"编辑本单元", icon: "edit"},
						"dele": {name:"删除本单元", icon: "delete"},
						"new": {name:"新建网元", icon: "add"},
						"type": {name:"类型", icon:'add',type:'select',
							options:{11: '用户点', 12: '室外基站站址', 13: '室内分布站址',21:'管道',22:'光缆',
								23:'电路',31:'行政区划',32:'光网格',33:'网络节点'}, selected: "12"},
						'find':{name:'查找网元',icon:'find'},
						"sep1": "---------",
						"enter": {name:"进入下层"},
						"return": {name:"返回上层"},
						"sep2": "---------",
						"load": {name:"装入新文件",icon: "copy"},
						"add":{name:"添加数据", icon: "paste"},
						"save": {name:"保存数据",icon: "quit"},
						"sep3": "---------",
						"SATELLITE":{name: "卫星图",type: 'checkbox',selected: false},
						'close': {name: "关闭菜单", callback: $.noop}
					},
					events: eventsfun }
				}
			}
  		}); //end of $.contextMenu
	});
}

var eventsfun = {
	show: function(opt) {
		// this is the trigger element
		var $this = this;
		// import states from data store, fills the input commands from the object, this.data() like {name:"foo", yesno:true,radio:"3",&hellip;}
		$.contextMenu.setInputValues(opt, $this.data());
	},
	hide: function(opt) {
		// this is the trigger element
		var $this = this;
		// export states to data store, dumps the input commands' values to an object,this.data() like {name:"foo", yesno:true, radio:"3", &hellip;}
		$.contextMenu.getInputValues(opt, $this.data());
		if (!this.data().SATELLITE && (vMapType == 'SATELLITE')){
			vMapType = 'NORMAL';
			mySatMap.hide();
		}
		if (this.data().SATELLITE && (vMapType == 'NORMAL')){
			vMapType = 'SATELLITE';
			mySatMap.show();
		}
	}
};
var func = {
	'load': function(opt){
//		$("#MapWindow").contextMenu("hide");
		if (vDataSave){
			if (!confirm("数据已经修改，放弃改变？")){
				return true;
			}
		};
		vDataAppendMode = 'new';
		fReadFile();
		return false;
	},
	'add': function(){
		vDataAppendMode = 'append';
		fReadFile();
	},
	'supplement':function(){
		vDataAppendMode = 'supplement';
		fReadFile();
	},
	'save': function(){
		fSaveFile();
	},
	'editborder':function(){
	    $("#MapWindow").contextMenu("hide");
		//$("#map_shantou").contextMenu(false);
		myLock.lock = true;
		myLock.noredraw = true;
		myLock.curid = vCurFatherID;
		myLock.celldisplay = fGetPtr(vaPtrCellDisplayed,'id',vCurFatherID);
		
		vNewDraw = myLock.celldisplay;
		vNewCell = fGetPtr(vaPtrCellDisplayed,'id',myLock.curid).cellptr;
		myCellModel.center = true;
		myCellModel.outbound = true;
		fModifyCell();
		return true;
	},
	'edit':function(){
		$("#MapWindow").contextMenu("hide");
		//e.originalThis && e.originalThis.stop();// 停止默认放大行为的执行
		myLock.lock = true;
		myLock.noredraw = true;

		switch(myLock.type){
			case "12": //室外基站站址
			vNewDraw = myLock.celldisplay;
			vNewCell = fGetPtr(vaPtrCellDisplayed,'id',myLock.curid).cellptr;
			myCellModel.center = true;
			myCellModel.outbound = false;
			fModifyCell(vNewCell.type);
			return true;

			case "31": //行政区划
			case "32": //光
			vNewDraw = myLock.celldisplay;
			vNewCell = fGetPtr(vaPtrCellDisplayed,'id',myLock.curid).cellptr;
			myCellModel.center = true;
			myCellModel.outbound = true;
			fModifyCell(vNewCell.type);
			return true;
			
			default:
			myLock.lock = false;
			myLock.noredraw = false;
			return true;
		}
	},
	'new':function(opt){
		$("#MapWindow").contextMenu("hide");
		//e.originalThis && e.originalThis.stop();// 停止默认放大行为的执行
		myLock.lock = true;
		myLock.noredraw = true;
		var myType = $.contextMenu.getInputValues(opt).type
		vNewCell = new Object({name:'',type:myType,display:true,deleted:false});

		switch(myType.slice(0,2)){
			case '12'://室外基站
			vNewCell.devices = [];
			vNewCell.type += "04";
			myCellModel.center = true;
			myCellModel.outbound = false;
			break;

			case '33':
			myCellModel.center = true;
			myCellModel.outbound = false;
			break;
			
			default:
			myCellModel.center = true;
			myCellModel.outbound = true;
			break;
		}
		vNewDraw = {outbound:null, center:null, cover:null, id:null, cellptr:null};
		fModifyCell(vNewCell.type);
		return true;
	},
	'dele':function(){  // 确认是否dele，是action，置在子程序中置change标记
		$("#MapWindow").contextMenu("hide");
		myLock.lock = true;
		switch(myLock.type){
			case "31": //行政区划
			if(myLock.curid == vCurFatherID){
				alert("不能删除边界");
				break;
			}
			case "12": //室外基站站址
		fDelCell(myLock.curid,true);
		break;

			default:
		break;
		}
		//e.originalThis && e.originalThis.stop();// 停止默认放大行为的执行
	},
	'backup':function(opt){
	$("#MapWindow").contextMenu("hide");
		fShowBackup(myLock.curid);
	},
	'enter':function(opt){
		$("#MapWindow").contextMenu("hide");
		
		if (myLock.type != '31') return; //行政区划
		if (!fGetPtr(vOrgData.cells, 'fatherID', myLock.curid)|| myLock.curid==0){
			alert("所在地点没有细分");				
			return;
   		}

   		if (vDataChanged) {
   			vOrgData = fUpdateOrgData();
   			vDataChanged = false;
   		}
   		vCurFatherID  = myLock.curid;
		fNewCurData(vOrgData, vCurFatherID);
    	fClearAndDraw(vMap,vCurFCells,vCurCCells,vCurFatherID,true);
	},
	'return':function(){
		$("#MapWindow").contextMenu("hide");
		var fatherAddr = fGetPtr(vOrgData.cells, 'ID', vCurFatherID);

		if (fatherAddr.ID == vOrgData.rootID){
				alert("上一层到顶了，要增加请通知管理员");				
				return;
		}
		vCurFatherID  = fatherAddr.fatherID;
		if (vDataChanged) {
   			vOrgData = fUpdateOrgData();
   			vDataChanged = false;
   		}
		fNewCurData(vOrgData, vCurFatherID);
    	fClearAndDraw(vMap,vCurFCells,vCurCCells,vCurFatherID,true);
	},
	'find':function(){
		$("#MapWindow").contextMenu("hide");
		myLock.menu = true;
		fOpenSearchWindow(vMap,myInfoWindow,{x:0,y:0});
		document.getElementById("iSearchName").focus();
	}
};

// ----------------delete the Cell: including its Children
// if confirmed = true, show
function fDelCell(id,confirmed) {
	if (confirmed){
		confirmed = confirm("删除单元ID="+id+" 将同时删除其下挂节点！");
	} else {
		confirmed = true;
	}
	
	if (confirmed){
	// 删图
		fEraseCell(vMap, id, true);
	// 删数
		fDelDataFandC(vCurCCells, id);
		fDelDataFandC(vCurFCells, id);
		vDataChanged = true;
		vDataSave = true;
	}
	myLock.lock = false;
	return true;
}
// 在图上删除指定id的cell及其儿子（显示只有下一级）, 并同时删除管理数组的数据。不删除工作json
// 返回成功否。 false 找不到, son = true 同时删除儿子
function fEraseCell(map, id, son){
	for (var i=vaPtrCellDisplayed.length-1; i>=0; i--){ // 定位管理数组中本身及儿子
		if (vaPtrCellDisplayed[i].id == id||(son&&vaPtrCellDisplayed[i].cellptr.fatherID == id)) {
			//删除Listener及相关的图
			if (vaPtrCellDisplayed[i].outbound) vaPtrCellDisplayed[i].outbound.setMap();
			if (vaPtrCellDisplayed[i].center) vaPtrCellDisplayed[i].center.setMap();
			if (vaPtrCellDisplayed[i].cover) vaPtrCellDisplayed[i].cover.setMap();
			//删除管理数组数据
			vaPtrCellDisplayed.splice(i,1);
		}
	}
}
// 删除工作数据中的节点及其儿子：在deleted做标记
function fDelDataFandC(cells,id){
	for (var i=0; i<cells.length; i++){
		if (cells[i].deleted) {continue;}
		if (cells[i].ID == id){	// 是要删除的节点
			fCounting(cells[i],false);
			cells[i].deleted = true;
		}
		if (cells[i].fatherID == id) {	// 是要删除的节点的子孙，删除该子孙
			fDelDataFandC(cells, cells[i].ID);
		}
	}
}

//--------generate/modify all types of Cell-------------------
// use: vNewDraw,vNewCell
// show info, enable drawing, when drawn set info enable, and close drawing/save data when done
//vNewCell = new Object({type:type,display:true,deleted:false});
//	vNewDraw = {outbound:null, center:null, cover:null, id:null, cellptr:null};
// center,outbound and circle if true means the cell contain that element
function fModifyCell(){
	var
	type = vNewCell.type.slice(0,2),
	hint='提示：确定中心点';

	if (vNewDraw.center) {	// 设为可编辑
		vNewDraw.center.setDraggable(true);
		vNewDraw.center.setIcon(vIconEditing);
		switch(type){
			case '12':
			hint = '提示：移动中心点、修改信息';
			break;
			
			case '31':
			vNewDraw.center.setOffset(new AMap.Pixel(-10,-34));
			default:
			hint = '提示：移动中心点、修改边界和信息';
			break;
		}
	} else if (myCellModel.center){
		vDrawingManager.marker();
		if (myDrawListener) AMap.event.removeListener(myDrawListener);
		myDrawListener = AMap.event.addListenerOnce(vDrawingManager,'draw',fMarkerComplete);
	}

	if (type !="12"){
	if (vNewDraw.outbound){
		vMap.plugin(["AMap.PolyEditor"],function(){
        	myPolygonEditor = new AMap.PolyEditor(vMap,vNewDraw.outbound);
        	myPolygonEditor.open();
    	});
	} else {
		if (myCellModel.outbound && !myCellModel.center){
			vDrawingManager.polygon();
			if (myDrawListener) AMap.event.removeListener(myDrawListener);
			myDrawListener = AMap.event.addListenerOnce(vDrawingManager,'draw',fPolygonComplete);
		}
	}
	}

	fOpenCellWindow(vMap, myInfoWindow,new AMap.Pixel(0,0), vNewCell,
		hint,fModifyCellAccepted, fModifyCellCanceled);
	document.getElementById("CellName").focus();
	return;
}

function fMarkerComplete(e){
	vNewDraw.center = e.obj;
	vNewDraw.center.setDraggable(true);
	if (!vNewDraw.outbounds){
		if (myCellModel.outbound){
			vDrawingManager.polygon();
			myDrawListener = AMap.event.addListenerOnce(vDrawingManager,'draw',fPolygonComplete);
			return;
		}
	}
	vDrawingManager.close(false);//不需要画polygon则终止
}
function fPolygonComplete(e){
	if (e.obj.getPath().length <=2){
		return;
	}
	vNewDraw.outbound = e.obj;
	vMap.plugin(["AMap.PolyEditor"],function(){
        myPolygonEditor = new AMap.PolyEditor(vMap,vNewDraw.outbound);
        myPolygonEditor.open();
    });
    myDrawListener = null;
    vDrawingManager.close(false);
}
function fModifyCellAccepted(){
	if (myCellModel.center && !vNewDraw.center){
		vDrawingManager.marker();
		if (myDrawListener) AMap.event.removeListener(myDrawListener);
		myDrawListener = AMap.event.addListenerOnce(vDrawingManager,'draw',fModifyCellCanceled);
		$('#CellFoot').text('提示：请确定中心点！');
		return;
	}
	if (myCellModel.outbound && !vNewDraw.outbound){
		vDrawingManager.polygon();
		if (myDrawListener) AMap.event.removeListener(myDrawListener);
		myDrawListener = AMap.event.addListenerOnce(vDrawingManager,'draw',fPolygonComplete);
		$('#CellFoot').text('提示：请确定边框！');

		return;
	}
	vDataChanged = true;
	vDataSave = true;

	// save data to vCurCCells/vCurFCells or modify
	// delete image at the map
	fCellSave(vNewCell, vNewDraw);
	if (vNewCell.type.slice(0,2)=='12'){
		if (vNewCell.devices.length == 0) {
			$('#CellFoot').text('提示：请选择无线设备！');
			return;
		}
	}

	if (vNewCell.ID) {	// have defined, edit
		fEraseCell(vMap, myLock.curid, false);
		if (myLock.fatherid!=0){ // 改变归属了，把CurCCells拷贝到vOrgData中
			for (var i=0; i<vOrgData.cells.length; i++){
				if (vOrgData.cells[i].ID == myLock.curid){
					vOrgData.cells.splice(i,1);
					delete vNewCell.display;
					delete vNewCell.deleted;
					vOrgData.cells.push(vNewCell);
					break;
				}
			}
			for (var i=0; i<vCurCCells.length; i++){
				if (vCurCCells[i].ID == myLock.curid){
					vCurCCells.splice(i,1);
					break;
				}
			}
			myLock.fatherid = 0;
		} else {
			fDrawCell(vMap, vNewCell, false, vCurFatherID == vNewCell.ID);
		}

	} else {
		vNewCell.ID = vMaxID;
		vMaxID++;
		
		if (vNewCell.type == '31') vCurFCells.push(vNewCell)
		else vCurCCells.push(vNewCell);
		if (vNewDraw.outbound) vNewDraw.outbound.setMap();
		if (vNewDraw.center) vNewDraw.center.setMap();
		if (vNewDraw.circle) vNewDraw.circle.setMap();
		fDrawCell(vMap, vNewCell, false, vCurFatherID == vNewCell.ID);
	}
	
	// 重画, shut down the window,and release lock
	fCloseInfoWindow();
	if (myDrawListener) AMap.event.removeListener(myDrawListener);
	myDrawListener = null;
	if (myPolygonEditor) myPolygonEditor.close();
	myPolygonEditor = null;

	myLock.lock = false;
	myLock.noredraw = false;
	myLock.selectfather = false;
}
// cell: ptr data, draw: ptr overlay on the map
// save window data to cell
function fCellSave(cell, draw){
	cell.name = $("#CellName").val();
	cell.address = $("#CellAddr").val();
	cell.remarks = $("#CellRemarks").val();
	if (draw.center){
		cell.position = {lng:draw.center.getPosition().lng, lat:draw.center.getPosition().lat};
	}
	if (draw.outbound){
		cell.outbounds=new Array();
		var myPath = draw.outbound.getPath();
		for (var i=0; i<myPath.length; i++){
			cell.outbounds.push({lng:myPath[i].lng,lat:myPath[i].lat})
		}
	}

	switch (cell.type.slice(0,2)){
		case '12':
	cell.type = "12" + $("#BaseStationScene").val().toString() + $("#BaseStationProgress").val().toString();
	cell.devices = new Array();
	$("#iCell [type='checkbox']").each(function(index,item){
		if ($(item).attr("checked")) {
			var e1 = item.id.slice(11,13);
			var e2 = item.id.slice(13);
			var e3 = "#" + item.id + "radius";
			var e4 = "#" + item.id + "Progress";
			cell.devices.push({"system":e1, "subsys":e2, "radius":$(e3).val(), "progress":$(e4).val()} );
		}
	});
	break;

		default:
	cell.family = $("#CellFamily").val();
	cell.user = $("#CellUser").val();
	cell.port = $("#CellPort").val();
	cell.fiber = $("#CellFiber").val();
	cell.id = $("#CellId").val();
	break;
	}
	
	// 确定father，如果是编辑更换了父亲，直接赋值；如果在某个区域内，则确认为father
	if (myLock.fatherid !=0) {
		cell.fatherID = myLock.fatherid;
	} else {
		cell.fatherID=vCurFatherID;
		for (var i=0; i<vaPtrCellDisplayed.length; i++){
			if (vaPtrCellDisplayed[i].id != vCurFatherID){
				if(vaPtrCellDisplayed[i].outbound){
					if (vaPtrCellDisplayed[i].outbound.contains(new AMap.LngLat(cell.position.lng,cell.position.lat))){
						cell.fatherID = vaPtrCellDisplayed[i].id;
						break;
					}
				}
			}
		}
	}
	
}

function fModifyCellCanceled(){
	if (!vNewCell.ID){	//new
		// 删除已经画出的部分
		if (vNewDraw.outbound) vNewDraw.outbound.setMap();
		if (vNewDraw.center) vNewDraw.center.setMap();
		if (vNewDraw.circle) vNewDraw.circle.setMap();
	} else { //edit
		fEraseCell(vMap, myLock.curid,false);
		fDrawCell(vMap, vNewCell, false, (myLock.curid==vCurFatherID));
	}
	
	// shut down the window,and release lock	
	fCloseInfoWindow();
	if (myDrawListener) AMap.event.removeListener(myDrawListener);
	vDrawingManager.close(true);
	if (myPolygonEditor) myPolygonEditor.close();
	myPolygonEditor = null;

	myLock.lock = false;
	myLock.noredraw = false;
	myLock.selectfather = false;
}

//---Search Window
function fOpenSearchWindow(map,infowindow,pixel){
	var myDiv = document.createElement('div'), 
	text = '';

	text += '<div id="iSearchTitle"/>'+
					'定位查找网元&nbsp;<input type="button" id="iSearchClose" value="关闭" onclick="fSearchClose()"/><br/></div>';
	text += '<div class="iSearchContent"/>'+
					'网元名称：<input type="text" id="iSearchName" style="width:150px;"/>&nbsp;'+
					'<input type="button" id="iSearchFind" value="查找" onclick="fSearchFind()"/><br/>'+
					'查找结果：<select id="iSearchResults" style="width:150px;"/></select>&nbsp;'+
					'<input type="button" id="iSearchGo" value="定位" onclick="fSearchGo()"/><br/></div>';
    
	myDiv.id = "iSearch";
	myDiv.innerHTML = text;
	document.body.appendChild(myDiv); //启用，可以计算高、宽，取参数

	fShowInfoWindow(map,fBuildInfoWindow(infowindow,myDiv),pixel);
	myLock.noclick = true;
}
function fSearchFind(){		//包含myName则列入
	var myName = $('#iSearchName').val();
	$("#iSearchResults").empty();
	for (var i=0; i<vCurCCells.length; i++){
		if (vCurCCells[i].display&&!vCurCCells[i].deleted){
			if (vCurCCells[i].name.indexOf(myName)!=-1){
				$("#iSearchResults").append(
					"<option value="+ i.toString()+ ">" + vCurCCells[i].name + "</option>");
			}
		}
	}
}
function fSearchClose(){
	fCloseInfoWindow();
	myLock.noclick = false;
	myLock.menu = false;
}
function fSearchGo(){
	var myPtr = parseInt($('#iSearchResults').val());
	var myCenter=new AMap.LngLat(vCurCCells[myPtr].position.lng, vCurCCells[myPtr].position.lat);
	vMap.setZoomAndCenter(15,myCenter);
	fHideInfoWindow();
	fOpenCellWindow(vMap,myInfoWindow,myCenter,vCurCCells[myPtr],
			'提示：网元信息',null,fCellCloseAndSearchShow);
	return true;
}
function fCellCloseAndSearchShow(){
	fCloseInfoWindow();
}

//---------------show backup---------
function fShowBackup(id){
//	myLock.noclick = true;
	myLastView.center = vMap.getCenter();
	myLastView.zoom = vMap.getZoom();

	vBackups = [];
	for (var i = 0; i<vOrgData.cells.length; i++){
		if (vOrgData.cells[i].fatherID==id||vOrgData.cells[i].ID==id)
			vBackups.push(fcopyOneCell(vOrgData.cells[i]));
	}
	for (var i=0; i<vCurCCells.length; i++){
		if (vCurCCells[i].fatherID==id||vCurCCells[i].ID==id){
			for (var j=0; j<vBackups.length; j++){
				if (vCurCCells[i].ID==vBackups[j].ID) break
			}
			if (j==vBackups.length) vBackups.push(fcopyOneCell(vCurCCells[i]))
		}
	}
	
	if (vBackups.length <= 1) {
		alert('没有备选基站');
		return false;
	}
	$('#ShowBackupNum').text((vBackups.length-1).toString());

	var path=[];
	for (var i=0;i<vBackups.length;i++){
		vBackups[i].display = true;
		vBackups[i].deleted = false;
		vBackups[i].fatherID = vMaxID;
		path.push({lng:vBackups[i].position.lng,lat:vBackups[i].position.lat});
	}
	var myBounds= fNewBounds(path);
	vCurCCells = vBackups;

	vCurFCells = [];
	vCurFCells.push({ID:vMaxID, fatherID:vCurFatherID, type:'31',name:'备选基站集合',outbounds:[],display:true, deleted:false});
	vCurFCells[0].outbounds.push({lng:myBounds.getSouthWest().lng,lat:myBounds.getSouthWest().lat});
	vCurFCells[0].outbounds.push({lng:myBounds.getNorthEast().lng,lat:myBounds.getSouthWest().lat});
	vCurFCells[0].outbounds.push({lng:myBounds.getNorthEast().lng,lat:myBounds.getNorthEast().lat});
	vCurFCells[0].outbounds.push({lng:myBounds.getSouthWest().lng,lat:myBounds.getNorthEast().lat});
	vCurFatherID = vCurFCells[0].ID;
	fClearAndDraw(vMap,vCurFCells,vCurCCells,vCurFatherID,true);

	fOpenShowBackupWindow();
}

function myBackupWindowClose(){
	fCloseInfoWindow();
	vCurFatherID = vCurFCells[0].fatherID;
	fNewCurData(vOrgData, vCurFatherID);
	fClearAndDraw(vMap,vCurFCells,vCurCCells,vCurFatherID,false);
	vMap.setZoomAndCenter(myLastView.zoom,myLastView.center);
	myLock.noclick = false;
}

//------Open = build + show ----------Backup infowindow
function fOpenShowBackupWindow(){
	var
	myDiv = document.createElement('div'),
	text = '';

	text += '<div id="ShowBackupTitle"/>'+
					'备选基站 <span id="ShowBackupNum"/>0</span>'+vCurCCells.length+'个</div>';
	text += '<div class="ShowBackupContent"/>'+
					'<input type="button" id="ShowBackupClose" value="关闭" onclick="myBackupWindowClose()"/><br/></div>';

	myDiv.setAttribute("id","iShowBackup");
	myDiv.innerHTML = text;
	document.body.appendChild(myDiv); //启用，可以计算高、宽，取参数

	fShowInfoWindow(vMap,fBuildInfoWindow(myInfoWindow,myDiv),{x:0,y:0});
	myLock.noclick = true;
}

//---------------------Open = Build + show
// map、infowindow、pixel：在map上的pixel点显示infowindow，内容是BaseStations
function fOpenBaseStationsWindow(map,infowindow,pixel){
	var myDiv = document.createElement('div'), 
	text = '';

	text += '<div id="BaseStationsTitle" class="button-group1" />'+
				'本大区基站站址共<span id="BaseStationsval"/>0</span>座<br/>'+
				'其中<select id ="BaseStationsArea" style="width:60px"/></select>有<span id="BaseStationsv"/>0</span>座<br/>'+
				'&nbsp;<input type="button" id="BaseStationsRefress" value="更新" onclick="fBaseStationsRefress()"/>'+
				'&nbsp;<input type="button" id="BaseStationsClose" value="关闭" onclick="fBaseStationsClose()"/><br/></div>';
	text += '<div class="BaseStationsSystem"/>'+
				'<form>'+
				'<input type="checkbox" id ="BaseStations4G"/>4G基站<span id="BaseStations4Gval"/>0</span>个<br/>'+
					'<fieldset>'+
					'<input type="checkbox" id ="BaseStations4G1800M" />1.8G基站<span id="BaseStations4G1800Mval"/>0</span>个<br/>'+
					'<input type="checkbox" id ="BaseStations4G2100M" />2.1G基站<span id="BaseStations4G2100Mval"/>0</span>个<br/>'+
					'<input type="checkbox" id ="BaseStations4G800M" />800M基站<span id="BaseStations4G800Mval"/>0</span>个'+
				'</fieldset></form></div>';
	text += '<div class="BaseStationsSystem"/>'+
				'<form>'+
				'<input type="checkbox" id ="BaseStations3G"/>3G/2G基站<span id="BaseStations3Gval">0</span>个<br/>'+
					'<fieldset>'+
					'<input type="checkbox" id ="BaseStations3G800M"/>800M基站<span id="BaseStations3G800Mval"/>0</span>个'+
				'</fieldset></form></div>';
	
	myDiv.id = "iBaseStations";
	myDiv.innerHTML = text;
	document.body.appendChild(myDiv); //启用，可以计算高、宽，取参数
	// 配置checkbox
	$("#BaseStations4G").click(function(){
		var i = $("#BaseStations4G").attr("checked") == "checked";
		$("#BaseStations4G1800M").attr("checked",i);
		$("#BaseStations4G2100M").attr("checked",i);
		$("#BaseStations4G800M").attr("checked",i);
	});
	$("#BaseStations3G").click(function(){
		$("#BaseStations3G800M").attr("checked",$("#BaseStations3G").attr("checked") == "checked");
	});
	$("#BaseStations2G").click(function(){
		$("#BaseStations2G800M").attr("checked",$("#BaseStations2G").attr("checked") == "checked");
	});
	// area赋值
	for (var i=0; i< vCurFCells.length; i++) {
		$("#BaseStationsArea").append(
			"<option value="+ vCurFCells[i].ID.toString()+ ">" + vCurFCells[i].name + "</option>");
	}

	//清零checkbox
	$("#iBaseStations [type='checkbox']").each(function(index,item){
		$(item).css("visibility","hidden");
	});
	// 把统计数值填入表中,统计数据存在basestations信息框中
	for (var i = 0; i<vCurCCells.length; i++){
		fCounting(vCurCCells[i],true)
	}

	fShowInfoWindow(map,fBuildInfoWindow(infowindow,myDiv),pixel);
}
// add 为 true 是加，为false是减。
function fCounting(cell,add){ //是基站则统计
	if (cell.type.slice(0,2)!="12") return;
	if (cell.deleted) return;
	for (var j=0; j<cell.devices.length; j++){
		var e1 = "#BaseStations"+cell.devices[j].system+cell.devices[j].subsys; //eg. e1=BaseStations4G1800M 
		var e2 = e1 + "val";	//eg. e2=BaseStations4G1800Mval
		var e3 = "#BaseStations"+cell.devices[j].system;	//eg. e1=BaseStations4G
		var e4 = e3 + "val";	//eg. e1=BaseStations4Gval
		var k = parseInt($(e2).text()) + 1;		
				
		$(e2).text(k.toString());
		$(e1).css("visibility","visible");
		$(e1).attr("checked",true);

		if (add){
			k = parseInt($(e4).text()) + 1;
		} else { k = parseInt($(e4).text()) - 1;}
		$(e4).text(k.toString());
		$(e3).css("visibility","visible");
		$(e3).attr("checked",true);
	}
	var icount = parseInt($("#BaseStationsval").text());	////统计总的站址数
	if (add) {icount++} else {icount--};
	$("#BaseStationsval").text(icount.toString());
	if (cell.display) {
		icount = parseInt($("#BaseStationsv").text());	//统计过滤后总的站址数
		if (add) {icount++} else {icount--};	
		$("#BaseStationsv").text(icount.toString());
	}
}
// function for button
function fBaseStationsRefress(){
	// 处理按键，先disable
	$("#BaseStationsTitle [type='button']").each(function(index,item){
		$(item).attr("disabled",true);
	});

	fBaseStationsCheckShow();
	fClearAndDraw(vMap,vCurFCells,vCurCCells,$('#BaseStationsArea').val(),true);
	
	$("#BaseStationsTitle [type='button']").each(function(index,item){
		$(item).attr("disabled",false);
	});
	myLock.refress = true;
}
// 根据basestations信息框的数据，设置显示数据vCurCCells.
// 如果非显示区域，不显示；是显示区域的如果不需要显示无线设备则不显示基站。if all devices disabled, set display to false
function fBaseStationsCheckShow(){
	var e = new String, myShow = false, jcount = 0;
	var myfatherid = $('#BaseStationsArea').val();
	for (var i=0; i<vCurCCells.length; i++){
		if (vCurCCells[i].type.slice(0,2)!="12"){
			vCurCCells[i].display = true;
			break;
		} 
		myShow = false;	//先缺省为不显示
		// 如果当前是父亲层，需要进一步检查是否需要显示。如果当前不是父亲层单元正好属于该层也需要检查
		if ((myfatherid == vCurFatherID)||(myfatherid == vCurCCells[i].fatherID )){
			for (var j=0; j<vCurCCells[i].devices.length; j++){
				e = "#BaseStations"+vCurCCells[i].devices[j].system+vCurCCells[i].devices[j].subsys;	// eg. BaseStations4G1800M
				myShow = ($(e).attr("checked")=="checked");
				if (myShow) break;
			}
		}
		vCurCCells[i].display = myShow;
		if (myShow) jcount++;
	}
	$("#BaseStationsv").text(jcount.toString());
	myLock.refress = true;
}
function fBaseStationsClose(){
	myLock.lock = false;
//	myLock.noredraw = false;
	if (!myLock.refress){
		fBaseStationsCheckShow();
	}
	fCloseInfoWindow();
}
// Open = build and show the cell
function fOpenCellWindow(map,infowindow,pixel,cell,hint,faccept,fcancel){
	var
	myDiv = document.createElement('div'),
	myHandle = {},
	ptr=fGetPtr(vCurFCells,'ID',cell.fatherID),
	txt,
	text = '';
	
	myLock.fatherid = 0;
	txt = (ptr)?ptr.name:"待定";

	text += '<div id="CellTitle" class="button-group1" />'+
		'<em>'+fGetPtr(deftype,'val',cell.type.slice(0,2)).name+'</em>&nbsp;&nbsp;&nbsp;';
	if (faccept){
		text +=	'<input type="button" value="确定" id="Cell_acceptBtn" onclick='+faccept.name+'() />&nbsp;'+
			'<input type="button" value="放弃" id="Cell_cancelBtn" onclick='+fcancel.name+'() /></div>';
	} else {
		text += '<input type="button" value="关闭" id="Cell_cancelBtn" onclick='+fcancel.name+'() /></div>';
	}
	text += '<div>'+
		'名字：<input type="text" id="CellName" style="width:150px;" value="'+cell.name+'"/> <br/>'+
		'地址：<input type="text" id="CellAddr" style="width:214px;" value="'+cell.address+'"/> <br/>'+
		'归属：<input type="button" id="CellFatherName" value='+txt+' style="width:214px;"/><br/>'+
		'备注：<input type="text" id="CellRemarks" style="width:214px;" value="'+fValue(cell.remarks)+'"/> <br/></div>';
	switch(cell.type.slice(0,2)){
		case '12':
			// 初始化设备进展取值
	var deviceP = new String();
	for (var i=0; i<vPreDefDProg.length; i++) {
		deviceP += "<option value="+ i.toString()+ ">" + vPreDefProg[i].name + "</option>";
	}
	var BaseStationS = '';
	for (var i=0; i<vPreDefUrban.length; i++){
		BaseStationS += "<option value="+ i.toString()+ ">" + vPreDefUrban[i].name + "</option>";
	}
	var BaseStationP = '';
	for (var i=0; i<vPreDefProg.length; i++){
		BaseStationP += "<option value="+ i.toString()+ ">" + vPreDefProg[i].name + "</option>";
	}

	text += '<div>'+
		'场景：<select id="BaseStationScene" value='+cell.type.slice(2,3)+' />'+BaseStationS+ '</select> &nbsp;'+
		'状态：<select id="BaseStationProgress" value='+cell.type.slice(3,4)+' />'+BaseStationP+'</select> <br/></div>';
	text += '<div class="BaseStationSystem" id="WCell4G">'+
		'<form>4G设备<br/><fieldset>'+
		'<input type="checkbox" id ="BaseStation4G1800M"/>1.8G半径'+
			'<input type="number" id="BaseStation4G1800Mradius"/>米'+
			'<select class="BSdeviceP" id="BaseStation4G1800MProgress" />'+deviceP+'</select><br/>'+
		'<input type="checkbox" id ="BaseStation4G2100M"/>2.1G半径'+
			'<input type="number" id="BaseStation4G2100Mradius"/>米'+
			'<select class="BSdeviceP" id="BaseStation4G2100MProgress"/>'+deviceP+'</select><br/>'+
		'<input type="checkbox" id ="BaseStation4G800M"/>800M半径'+
			'<input type="number" id="BaseStation4G800Mradius"/>米'+
			'<select class="BSdeviceP" id="BaseStation4G800MProgress"/>'+deviceP+'</select><br/>'+
		'</fieldset></form></div>';
	text += '<div class="BaseStationSystem" id="WCell3G">'+
		'<form>3G/2G设备<br/><fieldset>'+
		'<input type="checkbox" id ="BaseStation3G800M"/>800M半径'+
			'<input type="number" id="BaseStation3G800Mradius"/>米'+
			'<select class="BSdeviceP" id="BaseStation3G800MProgress"/>'+deviceP+'</select><br/>'+
		'</fieldset></form></div>';
	break;

		default:
	text += '<div>'+
		'户数：<input type="text" id="CellFamily" style="width:50px;" value="'+fValue(cell.family)+'"/>'+
		'宽带：<input type="text" id="CellUser" style="width:50px;" value="'+fValue(cell.user)+'"/><br/>'+
		'设备：<input type="text" id="CellPort" style="width:50px;" value="'+fValue(cell.port)+'"/>'+
		'光宽：<input type="text" id="CellFiber" style="width:50px;" value="'+fValue(cell.fiber)+'"/><br/>'+
		'编码：<input type="text" id="CellId" style="width:214px;" value="'+fValue(cell.id)+'"/> <br/></div>';
	break;
	}
					
    text += '<div id="CellFoot">'+hint+'</div>';

	myDiv.setAttribute("id","iCell");
	myDiv.innerHTML = text;
	document.body.appendChild(myDiv); //启用，可以计算高、宽，取参数

	$("#CellFatherName").click(function(){
			myLock.selectfather = true;
		});
	switch(cell.type.slice(0,2)){
		case '12':
		// 填写设备属性
		for (var i=0; i<cell.devices.length; i++){
			var e2 = "#BaseStation"+cell.devices[i].system+cell.devices[i].subsys; //eg. "#BaseStation4G1800M"
			$(e2).attr("checked",true);
			$(e2+"radius").val(cell.devices[i].radius);	//eg. "#BaseStation4G1800Mradius"
			$(e2+"Progress").val(cell.devices[i].progress);	// eg. "#BaseStation4G1800MProgress"
		}
	}
	document.body.removeChild(myDiv); //取消
	fShowInfoWindow(map,fBuildInfoWindow(infowindow,myDiv),pixel);
}
function fValue(txt){
	return (txt)?txt:'';
}
function fBuildInfoWindow(infowindow,div){
	var
	handle = {};

	document.body.appendChild(div); //启用，可以计算高、宽，取参数
	handle.width = div.offsetWidth;
    handle.height = div.offsetHeight;
	handle.content = div;

	div.parentNode.removeChild(div);
	infowindow.setContent(div);
	return handle;
}
//  pos pixel
function fShowInfoWindow(map,handle,pixel){
	if (pixel ==null) {
		if (typeof handle.lng!='undefined'){
			myInfoWindow.open(map, new AMap.LngLat(handle.lng,handle.lat));
		} else {
			myInfoWindow.open(map,map.containerToLngLat(new AMap.Pixel(handle.posx,handle.posy)));
		}
		return true;
	}
	// 调整在视野上
	if (typeof pixel.lng!='undefined'){
		delete handle.posx;
		delete handle.posy;
		handle.lng = pixel.lng;
		handle.lat = pixel.lat;
		myInfoWindow.open(map, new AMap.LngLat(handle.lng,handle.lat));
	} else {
		var iW = $("#MapWindow").width(),
		iH = $("#MapWindow").height(),
		iFW = handle.width,
		iFH = handle.height,
		iPW= pixel.x,
		iPH= pixel.y;
	
		if (iPH + iFH > iH)	{iPH = iH} else {iPH += iFH };
		if (iPW + iFW/2 > iW) {iPW = iW - iFW/2} else {iPW += iFW/2 };
	
		handle.posx = iPW;
		handle.posy = iPH;
		delete handle.lng;
		delete handle.lat;
		myInfoWindow.open(map,map.containerToLngLat(new AMap.Pixel(handle.posx,handle.posy)));
	}
//	myLock.noredraw = true;
	myShowWindows.push(handle);
	return true;
}
// hide the infowindow and keep the content in memory
function fHideInfoWindow(){
	myInfoWindow.close();
	return true;
//	myLock.noredraw = false;
}
// destroy the recent infowindow, and show the previous infowindow
function fCloseInfoWindow(){
	if (myShowWindows.length==0) return false;
	
	var handle = myShowWindows.pop();
	myInfoWindow.close();
	
	if (handle.content) {
		handle.content.parentNode.removeChild(handle.content);
		handle.content = null;
	}
	if (myShowWindows.length!=0){
			fBuildInfoWindow(myInfoWindow,myShowWindows[myShowWindows.length-1].content)
			fShowInfoWindow(vMap,myShowWindows[myShowWindows.length-1]);
	}
	return true;
}

//-------------File 读取文件，装入vOrgData，可以添加在当前层。格式不对时用vIiniData代替
function fReadFile(){
	if (!(window.File && window.FileReader && window.FileList)){
		// 如果不支持 HTML5 读取文件
		var text = prompt('请将文件内容粘贴到这里并按 Enter。','');
		if(text){
			vDataAdded = JSON.parse(text);
			if (!fCheckData(vDataAdded)) {
				vDataAdded = fcopyOneCell(vIniData);
			};
			fLoadDataAndShow(vDataAdded,vDataAppendMode);
		}
	}else{
		// 使用 HTML5 方式读取
		var $f = $('<input type="file" />').css('display', 'none');
		$f.change(fReadFileLoader).unbind('click').click();
	}
}
// 当选择一个文件的时候的处理程序
function fReadFileLoader(event){
	var file = event[event.dataTransfer ? 'dataTransfer' : 'target'].files; // FileList object 是一个数组，这里只取第一项
	if(file.length == 0) return false;
	var reader = new FileReader();

	// 读取文件完成时执行 onLoad 事件，先设置事件
	reader.onload = function(event){
		if(event.target.readyState == 2){
			vDataAdded = JSON.parse(event.target.result);
			if (!fCheckData(vDataAdded)&&(vDataAppendMode != 'supplement')) {
				vDataAdded = fcopyOneCell(vIniData);
			};

			fLoadDataAndShow(vDataAdded,vDataAppendMode);
		}else{ // 出错
			alert('读取文件时出错：'+ event.target.error);
		}
	};
	reader.readAsText(file[0]);
	event.preventDefault ? event.preventDefault() : event.returnValue = false;
}
//---check the format
function fCheckData(obj){
	if (obj.file_version !=5){
		return false;
	};
	if (typeof(obj.rootID)=="undefined"){
		return false;
	}
	if (typeof(obj.cells)=="undefined"){
		return false;
	}
	if (obj.cells.length == 0){
		return false;
	}
	if (fGetPtr(obj.cells,'ID',obj.rootID) == null){
		return false;
	}
	if (fGetPtr(obj.cells,'fatherID',obj.rootID) == null){
		return false;
	}
	return true;
}
//------------------导出数据------------
// 对vOrgData数据进行修改删除，后写入文件。
function fSaveFile(){ // text, filename
	var myCell = new Object;
	var myTemp = new Object;
	var myCurPtr = new Object;
/*
	// 把vOrgData中非当前处理数据copy出来
	for (var i=0; i<vOrgData.cells.length; i++){
		if ((vOrgData.cells[i].ID != vCurFatherID)&&(vOrgData.cells[i].fatherID!=vCurFatherID)) {
			vtemp.cells.push(fcopyOneCell(vOrgData.cells[i]));
		}
	}
	// 把当前处理数据copy出来
	for (var i=0; i<vCurFCells.length; i++){
		if (!vCurFCells[i].deleted){
			myCell = fcopyOneCell(vCurFCells[i]);
			delete myCell.deleted;
			delete myCell.display;
			vtemp.cells.push(myCell);
		}
	}
	for (var i=0; i<vCurCCells.length; i++){
		if (!vCurCCells[i].deleted){
			myCell = fcopyOneCell(vCurCCells[i]);
			delete myCell.deleted;
			delete myCell.display;
			vtemp.cells.push(myCell);
		}
	}
*/
	if (vDataChanged){
		vOrgData = fUpdateOrgData();
		vDataChanged = false;	
	}
	myTemp = fcopyOneCell(vOrgData);
//	fBD09toGCJ02(myTemp.cells);
	var filename = prompt('请输入文件名:');
	if (filename != null) {
		filename += ".json";
		saveAs(new Blob([JSON.stringify(myTemp)], {type: "application/json;charset=utf-8"}), filename);
		vDataChanged = false;
		vDataSave = false;
	}
	return true;
}
// 先把vOrgData中被删的部分剔除、可能修改的用新数据填入，再将新增的部分加入
function fUpdateOrgData(){
	var vtemp = new Object({"file_version":5, rootID:vOrgData.rootID, cells:[]});
	var myCurPtr = new Object;
	for (var i=0; i<vOrgData.cells.length; i++){
		myCurPtr = fGetPtr(vCurCCells,'ID', vOrgData.cells[i].ID);
		if (myCurPtr) {
			if (!myCurPtr.deleted){
				myCell = fcopyOneCell(myCurPtr);
				delete myCell.deleted;
				delete myCell.display;
				vtemp.cells.push(myCell);		
			}
		} else {
			myCurPtr = fGetPtr(vCurFCells,'ID', vOrgData.cells[i].ID);
			if (myCurPtr) {
				if (!myCurPtr.deleted){
					myCell = fcopyOneCell(myCurPtr);
					delete myCell.deleted;
					delete myCell.display;
					vtemp.cells.push(myCell);		
				}
			} else vtemp.cells.push(fcopyOneCell(vOrgData.cells[i]));
		}
	}

	for (var i=0; i<vCurCCells.length; i++){
		if (!vCurCCells[i].deleted){
			myCurPtr = fGetPtr(vOrgData.cells,'ID', vCurCCells[i].ID);
			if (!myCurPtr){
				myCell = fcopyOneCell(vCurCCells[i]);
				delete myCell.deleted;
				delete myCell.display;
				vtemp.cells.push(myCell);
			}
		}
	}
	return vtemp;
}