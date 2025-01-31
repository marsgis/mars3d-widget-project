;(function (window, mars3d) {
  //全局中间变量
  let currJD
  let currWD
  let currGD

  //创建widget类，需要继承BaseWidget
  class MyWidget extends es5widget.BaseWidget {
    //外部资源配置
    get resources() {
      return ["view.css"]
    }
    //弹窗配置
    get view() {
      return {
        type: "divwindow",
        url: "view.html",
        windowOptions: {
          width: 340,
          height: 300
        }
      }
    }

    //每个窗口创建完成后调用
    winCreateOK(opt, result) {
      let point = this.map.getCenter()
      point.format()
      currJD = point.lng
      currWD = point.lat
      currGD = point.alt

      this.chooseEvent() //事件处理
      this.updateTen()
    }
    //激活插件
    activate() {
      //单击地图事件
      $("#btnSelectPoint").click(() => {
        this.map.once(mars3d.EventType.click, this.onMapClick, this)
      })
    }
    //释放插件
    disable() {
      //释放单击地图事件
      this.map.off(mars3d.EventType.click, this.onMapClick, this)

      if (this.graphic) {
        this.map.graphicLayer.removeGraphic(this.graphic, true)
        this.graphic = null
      }
    }

    onMapClick(event) {
      let cartesian = event.cartesian
      if (cartesian) {
        let point = mars3d.LngLatPoint.fromCartesian(cartesian)

        point.format()
        currJD = point.lng
        currWD = point.lat
        currGD = point.alt

        this.updateMarker(point)

        this.updateTen()
        this.updataDfm()
        this.updata3GKZone()
        this.updata6GKZone()
      }
    }
    //点击地图坐标更新
    updateMarker(position, iscenter) {
      if (this.graphic) {
        this.graphic.position = position
      } else {
        this.graphic = new mars3d.graphic.BillboardEntity({
          position: position,
          style: {
            image: this.path + "//data.mars3d.cn/img/marker.png",
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // default: CENTER
            scale: 0.6
          }
        })
        this.map.graphicLayer.addGraphic(this.graphic)
      }

      if (iscenter) {
        this.map.flyToGraphic(this.graphic, { radius: 2000 })
      }

      //演示：抛出事件，在其他widget或vue中监听使用
      es5widget.fire("centerXY", { position: position })
    }

    //===============================================================================

    chooseEvent() {
      $("#txtLngTen,#txtLatTen,#txtLatAlt").change(() => {
        this.changeTen()
      })

      $("#txtLngDegree,#txtDmsAlt,#txtLngMinute,#txtLngSecond,#txtLatDegree,#txtLatMinute,#txtLatSecond").change(() => {
        this.changeDfm()
      })

      $("#txtGk3X,#txtGk3Y,#txtGk3Alt").change(() => {
        this.change3GKZone()
      })

      $("#txtGk6X,#txtGk6Y,#txtGk6Alt").change(() => {
        this.change6GKZone()
      })

      $("#btnCenterXY").click(() => {
        if (currJD > 180 || currJD < -180) {
          haoutil.alert("请输入有效的经度值！")
          return
        }
        if (currWD > 90 || currWD < -90) {
          haoutil.alert("请输入有效的纬度值！")
          return
        }
        let point = new mars3d.LngLatPoint(Number(currJD), Number(currWD), Number(currGD))

        this.updateMarker(point, true)
      })

      $('input:radio[name="rdoType"]').change(() => {
        let selectType = $('input:radio[name="rdoType"]:checked').val()
        switch (selectType) {
          default:
            //十进制
            $(".viewTen").show()
            $(".viewDms").hide()
            $(".viewGk").hide()
            this.updateTen()
            break
          case "2": //度分秒
            $(".viewDms").show()
            $(".viewTen").hide()
            $(".viewGk").hide()
            this.updataDfm()
            break
          case "3": //CGCS2000
            $(".viewTen").hide()
            $(".viewDms").hide()
            $(".viewGk").show()
            this.updata3GKZone()
            this.updata6GKZone()

            break
        }
      })

      $('input:radio[name="rdoGkType"]').change(() => {
        let selectType = $('input:radio[name="rdoGkType"]:checked').val()
        switch (selectType) {
          case "1": // 三分度带
            $(".viewGk6").hide()
            $(".viewGk3").show()
            this.updata3GKZone()
            break
          case "2": // 六分度带
            $(".viewGk6").show()
            $(".viewGk3").hide()
            this.updata6GKZone()

            break
        }
      })
    }

    //更新：十进制
    updateTen() {
      $("#txtLngTen").val(currJD.toFixed(6))
      $("#txtLatTen").val(currWD.toFixed(6))
      $("#txtLatAlt").val(currGD.toFixed(1))
    }
    // 修改了：十进制
    changeTen() {
      currJD = Number($("#txtLngTen").val() || 0) //获取经度
      currWD = Number($("#txtLatTen").val() || 0) //获取纬度
      currGD = Number($("#txtLatAlt").val() || 0) //高度
    }

    //更新：度分秒
    updataDfm() {
      let tenJD = mars3d.PointTrans.degree2dms(currJD)
      $("#txtLngDegree").val(tenJD.degree)
      $("#txtLngMinute").val(tenJD.minute)
      $("#txtLngSecond").val(tenJD.second)

      let tenWD = mars3d.PointTrans.degree2dms(currWD)
      $("#txtLatDegree").val(tenWD.degree)
      $("#txtLatMinute").val(tenWD.minute)
      $("#txtLatSecond").val(tenWD.second)

      $("#txtDmsAlt").val(currGD)
    }

    //修改了：度分秒
    changeDfm() {
      let jd_du = Number($("#txtLngDegree").val() || 0) //获取
      let jd_fen = Number($("#txtLngMinute").val() || 0)
      let jd_miao = Number($("#txtLngSecond").val() || 0)
      currJD = mars3d.PointTrans.dms2degree(jd_du, jd_fen, jd_miao)

      let wd_du = Number($("#txtLatDegree").val() || 0) //获取
      let wd_fen = Number($("#txtLatMinute").val() || 0)
      let wd_miao = Number($("#txtLatSecond").val() || 0)
      currWD = mars3d.PointTrans.dms2degree(wd_du, wd_fen, wd_miao)

      currGD = Number($("#txtDmsAlt").val() || 0) //高度
    }

    //更新：2000平面坐标三分度
    updata3GKZone() {
      let zone3 = mars3d.PointTrans.proj4Trans([currJD, currWD], mars3d.CRS.EPSG4326, mars3d.CRS.CGCS2000_GK_Zone_3) //十进制转2000平面三分度
      $("#txtGk3X").val(mars3d.Util.formatNum(zone3[0], 1))
      $("#txtGk3Y").val(mars3d.Util.formatNum(zone3[1], 1))
      $("#txtGk3Alt").val(currGD)
    }

    //修改了：2000平面坐标三分度
    change3GKZone() {
      let jd = Number($("#txtGk3X").val()) //获取
      let wd = Number($("#txtGk3Y").val())
      let gk3 = mars3d.PointTrans.proj4Trans([jd, wd], mars3d.CRS.CGCS2000_GK_Zone_3, mars3d.CRS.EPSG4326)
      currJD = gk3[0]
      currWD = gk3[1]
      currGD = Number($("#txtGk3Alt").val() || 0) //高度
    }

    //更新：2000平面坐标六分度
    updata6GKZone() {
      var zoon6 = mars3d.PointTrans.proj4Trans([currJD, currWD], mars3d.CRS.EPSG4326, mars3d.CRS.CGCS2000_GK_Zone_6) //十进制转2000平面六分度
      $("#txtGk6X").val(mars3d.Util.formatNum(zoon6[0], 1))
      $("#txtGk6Y").val(mars3d.Util.formatNum(zoon6[1], 1))
      $("#txtGk6Alt").val(currGD)
    }

    //修改了：2000平面坐标六分度
    change6GKZone() {
      var jd = Number($("#txtGk6X").val()) //获取
      var wd = Number($("#txtGk6Y").val())
      var gk6 = mars3d.PointTrans.proj4Trans([jd, wd], mars3d.CRS.CGCS2000_GK_Zone_6, mars3d.CRS.EPSG4326)

      currJD = gk6[0]
      currWD = gk6[1]
      currGD = Number($("#txtGk6Alt").val() || 0) //高度
    }
  }

  //注册到widget管理器中。
  es5widget.bindClass(MyWidget)

  //每个widet之间都是直接引入到index.html中，会存在彼此命名冲突，所以闭包处理下。
})(window, mars3d)
