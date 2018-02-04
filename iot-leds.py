from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import mraa
import time

endpoint = "a13a0acc0pv8gr.iot.us-east-1.amazonaws.com"
rootCAPath = "root-CA.crt"
privateKeyPath = "Dragonboard.private.key"
certificatePath = "Dragonboard.cert.pem"
clientID = "13"

myAWSIoTMQTTClient = AWSIoTMQTTClient(clientID)
myAWSIoTMQTTClient.configureEndpoint(endpoint, 8883)
myAWSIoTMQTTClient.configureCredentials(rootCAPath, privateKeyPath, certificate$
myAWSIoTMQTTClient.connect()

def light_led(switch, gpio):
        try:
                led = mraa.Gpio(gpio)
                led.dir(mraa.DIR_OUT)
        except:
                print "rip"

def reset_leds():
        for x in range(23, 35):
                light_led(0, x)

def activate_leds():
        for x in range(23, 35):
                light_led(1, x)

reset_leds()



def callback(client, userdata, message):
        print "Information received:"
        print message.payload
        print "From topic:"
        print message.topic
        
        payload = message.payload
        params = payload.split()

        if message.topic == "led":
                if params[0] == "on":
                        activate_leds()
                elif params[0] == "off":
                        reset_leds()
                elif params[1] == "on":
                        if (len(params) > 2):
                                time.sleep(int(params[2]))      
                        light_led(1, int(params[0]))
                else:   
                        if (len(params) > 2):
                                time.sleep(int(params[2]))
                        light_led(0, int(params[0]))

myAWSIoTMQTTClient.subscribe("led", 0, callback)

end = input()
