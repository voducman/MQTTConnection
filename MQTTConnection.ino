/*********************Project Informations***********************
  * Mo ta du an: Dự án Luận văn tốt nghiệp gồm: 
		+ Hệ thống chiếc rót nước vào chai
		+ Panel điều khiển trên HMI
		+ Hệ thống thu thập và điều khiển sử dụng Cloud gồm:
			- 1 Gateway (NodeMCU) đọc và ghi xuống S7-1200 PLC (giao thức S7 Protocol)
			- 1 Access Point Router có kết nối internet
			- 1 cáp Ethernet nối từ PLC đến Router
  * Phan cung: PLC S7-1200 + NodeMCU + Router wifi + MQTT Broker (MQTTCloud free 5 concurrent connections) + Physical system
  * Nguoi thuc hien: lequoccuong
  * Thoi gian thuc hien:  + Bat dau:  1/3/2020
                          + Ket thuc: 
						  
						  
/*************************************************************/
/*                  KHAI BÁO THƯ VIỆN SỬ DỤNG                */
/* Download to use */
#include <Platform.h>    
#include "Settimino.h"
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <cstdio>

/* Default library */
#include "string.h"
#include <iostream>
#include <sstream>

using namespace std;

/**************************************************************/
/*          DEFINE CÁC HẰNG SỐ TRONG CHƯƠNG TRÌNH             */

// Thông tin về wifi
#define ssid     "The Coffe House"
#define password "hoiphata"

// Thông tin về MQTT Broker
#define mqtt_server      "m24.cloudmqtt.com"  // Using cloudMQTT - free 5 connections
#define mqtt_topic_pub   "lequoccuong/test"   // topic is "voducman/control"
#define mqtt_topic_sub   "lequoccuong/#"      // subcribe all topic after "voducman/..."
#define mqtt_topic_read  "lequoccuong/read"   // For production stage
#define mqtt_topic_write "lequoccuong/write"  // For production stage
#define mqtt_user        "bdzsrzdm"           // Username in Detail page in CloudMQTT 
#define mqtt_pwd         "lAbxfgDF7x-z"       // Password in Detail page in CloudMQTT 


// Parameters cho hàm đọc và ghi vào PLC
#define  RUN         1
#define  WEB_RESET   2
#define  WEB_EMER    3
#define  VALUE_V11   4
#define  VALUE_V22   5
#define  VALUE_V1    6
#define  VALUE_V2    7


/***************************************************************/
/*                            KHAI BÁO BIẾN                    */   

const uint16_t mqtt_port = 13107; //Port của CloudMQTT

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
int value = 0;
boolean status_ = false;
int code;

// Enter a MAC address and IP address for your controller below.
// The IP address will be dependent on your local network:
//80:7d:3a:78:d8:e8
byte mac[] = {
  0x80, 0x7d, 0x3a, 0x78, 0xd8, 0xe8 };
 
//IPAddress Local(192,168,100,70); // Local Address
IPAddress PLC(192,168,100,105);    // PLC Address

//byte Buffer[512];

S7Client Client;
unsigned long Elapsed; // To calc the execution time


/*****************************************************************/
/*                      UTILS FUNCTION                           */



// Function for connect to PLC
bool connect()
{
    int Result=Client.ConnectTo(PLC,
                                  0,  // Rack (see the doc.)
                                  1); // Slot (see the doc.)
    Serial.print("Connecting to "); Serial.println(PLC); 
    if (Result==0)
    {
      Serial.print("Connected ! PDU Length = "); Serial.println(Client.GetPDULength());
    }
    else
      Serial.println("Connection error");
    return Result==0;
}


void CheckError(int ErrNo, char message[] = "")
{
  Serial.print("Error at: ");Serial.print(message);Serial.print("- No. 0x");
  Serial.println(ErrNo, HEX);
 
  // Checks if it's a Severe Error => we need to disconnect
  if (ErrNo & 0x00FF)
  {
    Serial.println("SEVERE ERROR, disconnecting.");
    Client.Disconnect();
  }
}


void MarkTime()
{
  Elapsed=millis();
}
//----------------------------------------------------------------------
void ShowTime()
{
  // Calcs the time
  Elapsed=millis()-Elapsed;
  Serial.print("Job time (ms) : ");
  Serial.println(Elapsed);   
}

// Hàm kết nối wifi
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  //Cannot connect to MQTT Broker when using static IP
  //WiFi.config(staticIP, gateway, subnet);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".....\r\n");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// Hàm call back để nhận dữ liệu
void callback(char* topic, byte* payload, unsigned int length) {


  char cstr[length+1];
  cstr[length + 1] = '\0';
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }

  String result = String((char*)payload);
  result = result.substring(0, length);
  
  String chanel = result.substring(0,4);
  String value  = result.substring(5);
  String topic_ = String(topic);
  
  Serial.println();
  Serial.print("payload: ");
  Serial.println(chanel);
  Serial.println(value);
  Serial.println("-----");
  
  if (topic_.equals("lequoccuong/write")){
      if (chanel.equals("runn")){
        writeTag(RUN, value);
        Serial.print("Write Run: "); 
        Serial.println(value);
        
      }else if (chanel.equals("emer")){
        writeTag(WEB_EMER, value);
        Serial.print("Write web_emer: "); 
        Serial.println(value);
        
      }else if(chanel.equals("rese")){
        writeTag(WEB_RESET, value);
        Serial.print("Write web_reset: "); 
        Serial.println(value);
        
      }else if(chanel.equals("val1")){
        writeTag(VALUE_V1, value);
        Serial.print("Write val_v1: "); 
        Serial.println(value);
        
      }
      else if(chanel.equals("val2")){
        writeTag(VALUE_V2, value);
        Serial.print("Write val_v2: "); 
        Serial.println(value);
        
      }
      else if(chanel.equals("va11")){
        writeTag(VALUE_V11, value);
        Serial.print("Write val_v11: "); 
        Serial.println(value);
        
      }
      else if(chanel.equals("va22")){
        writeTag(VALUE_V22, value);
        Serial.print("Write val_v22: "); 
        Serial.println(value);
        
      }
  }
}


// Hàm reconnect thực hiện kết nối lại khi mất kết nối với MQTT Broker
void reconnect() {
  // Chờ tới khi kết nối
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Thực hiện kết nối với mqtt user và pass
    if (client.connect("ESP8266Client", mqtt_user, mqtt_pwd)) {
      Serial.println("connected");
      // Khi kết nối sẽ publish thông báo
      client.publish(mqtt_topic_pub, "ESP_reconnected");
      // ... và nhận lại thông tin này
      client.subscribe(mqtt_topic_sub);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");

      // Đợi 5s
      delay(500);
    }
  }
}

// Function to convert string to int
int string2int(string var){
//  stringstream strs;
//  int output;
//  strs << var;
//  strs >> output;
  int output;

  if (sscanf(var.c_str(), "%d", &output) == 1){
    
    return output;
  }else{
    
  return 0;
  }
}


// Function to convert byte to string
string byte2string(byte* payload,  unsigned int length){
  stringstream strs;
  string output;

  for (int i = 0; i < length; i++) {
    strs << ((char)payload[i]);
  }
 
  strs >> output; 
  return output;
}

// Function to convert char to string
string char2string(char* var){
  stringstream strs;
  string output;
  
  strs << var;
  strs >> output;
  
  return output;
}

// Function to convert string to char[]
void string2char(string var, char* var_){
  var = (char*)var.c_str();
  return;
}

// Funtion to wrap 2 byte of integer 16 bits
void wrapint(int & var){
  unsigned char low  = (var & 0x00FF);
  unsigned char high = var>>8; 
  var = (unsigned int)(low << 8)|high;
  return;
}


// Function to read tag value from PLC S7-1200 to NodMCU 
void readAllTag(boolean &run, boolean &web_emer, int &val_v11, int &val_v22, int &val_v1, int &val_v2, int &total){
  byte Buffer_[512];
  int code = Client.ReadArea(S7AreaMK, 0/*ignored*/, 0, 30, S7WLByte, &Buffer_);

  if (code == 0){
     run      = S7.BitAt(&Buffer_, 0, 0);
     web_emer = S7.BitAt(&Buffer_, 0, 1);

     total    = S7.IntegerAt(&Buffer_, 20);   
     val_v11  = S7.IntegerAt(&Buffer_, 22);
     val_v22  = S7.IntegerAt(&Buffer_, 24);
     val_v1   = S7.IntegerAt(&Buffer_, 26);
     val_v2   = S7.IntegerAt(&Buffer_, 28);
     
   }else{
     CheckError(code, "Run tag");
     delay(500); 
   }
}

// Function to write tag value from NodMCU to PLC S7-1200

void writeTag(int tagName, String value){
  int code;
  boolean boolVal = false;
  int intVal = 0;
  
  switch(tagName){
   case RUN: 
    boolVal = (value.equals("1") || value.equals("true"));
    code = Client.WriteBit(S7AreaMK, 0/*ignored*/, 0, 0, boolVal); 
    Serial.println(boolVal);
    break;

    case WEB_EMER: 
    boolVal = (value.equals("1") || value.equals("true"));
    code = Client.WriteBit(S7AreaMK, 0/*ignored*/, 0, 1, boolVal); 
    break;

   case WEB_RESET: 
    boolVal = (value.equals("1") || value.equals("true"));
    code = Client.WriteBit(S7AreaMK, 0/*ignored*/, 0, 2, boolVal); 
    break;
    
   case VALUE_V11: 
    intVal = value.toInt();
    wrapint(intVal);
    code = Client.WriteArea(S7AreaMK, 0/*ignored*/, 22, 2, &intVal);
    break;
    
   case VALUE_V22: 
    intVal = value.toInt();
    wrapint(intVal);
    code = Client.WriteArea(S7AreaMK, 0/*ignored*/, 24, 2, &intVal);
    break;
    
   case VALUE_V1: 
     intVal = value.toInt();
     wrapint(intVal);
     code = Client.WriteArea(S7AreaMK, 0/*ignored*/, 26, 2, &intVal);
     break;
     
   case VALUE_V2: 
    intVal = value.toInt();
    wrapint(intVal);
    code = Client.WriteArea(S7AreaMK, 0/*ignored*/, 28, 2, &intVal);
    break;
   }

   Serial.print("Code of Write: 0x"); Serial.println(code, HEX);

 }
/*****************************************************************/
/*             LIFECYCLE FUNCTION (of Arduino IDE)               */

 void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port); 
  client.setCallback(callback);

}



void loop() {
  
  char msg[256]; msg[255] = '\0';
  
  boolean run = false, web_emer = false, web_reset = false, result;
  int val_v11 = 0, val_v22 = 0, val_v1 = 0, val_v2 = 0;
  int total = 0;
  
  // Get current time
   Elapsed = millis();

   if (WiFi.status() != WL_CONNECTED) {
      WiFi.begin(ssid, password);
      while(WiFi.status() != WL_CONNECTED){
        Serial.print("---\r\n");
      }   
  }
   
  // Check to connect to MQTT Broker
  if (!client.connected() != 0) {
    reconnect();
  }

   /*if (status_){
    // Disconnect with PLC
    Serial.println("Disconnect to PLC");
    status_ = false;

    Client.Disconnect();
    delay(500);
    if(Client.Connected == true){  
      Serial.println("Waiting to disconnect");
      delay(100);
    }*/
  
  
  // Check for connect to PLC
  while (Client.Connect() != 0)
  {
    Serial.println("Try to connect to PLC at: 192.168.100.105");
    if (!connect()){
      Serial.println("Connect to PLC Unsuccess");
      delay(100);
    }
  }


  // Function to keep connecting to MQTT Broker
  client.loop();
  
  // Sau mỗi 1s sẽ thực hiện publish dòng hello world lên MQTT broker
  unsigned long now = millis();
  if (now - lastMsg > 1000) {
    
    lastMsg = now;

    // Always read all tag in PLC
    readAllTag(run , web_emer, val_v11, val_v22, val_v1, val_v2, total);
   
    // Publish data to MQTT Cloud
    val_v1  = (val_v1  > 0)? val_v1 :0;
    val_v2  = (val_v2  > 0)? val_v2 :0;
    val_v11 = (val_v11 > 0)? val_v11:0;
    val_v22 = (val_v22 > 0)? val_v22:0;
    
    snprintf (msg, 256, "{\"run\":\"%d\", \"web_emer\":\"%d\", \"v11\":\"%d\", \"v22\":\"%d\", \"v1\":\"%d\", \"v2\":\"%d\", \"total\":\"%d\"}", (int)run, (int)web_emer,  (int)val_v11,  (int)val_v22,  (int)val_v1,  (int)val_v2,  (int)total);
    Serial.println(msg);
    result = client.publish(mqtt_topic_read, msg);

    if (result){
      Serial.print("Publish message: ");
      Serial.println(msg);
      ShowTime();
    }else{
      // Error right here...can received without publish
      Serial.println("Publish not success!!");  
      Serial.println(client.connected());
    }
    
  }
}
