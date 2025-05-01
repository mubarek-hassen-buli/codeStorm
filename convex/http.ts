import {httpRouter} from "convex/server"
import { httpAction } from "./_generated/server";
import {Webhook} from "svix"
import { WebhookEvent } from "@clerk/nextjs/server";
import { api } from "./_generated/api";
// Initialize the HTTP router
const http = httpRouter();
//we are listening to the clerk webhook
http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async(ctx,request)=>{
        // Validate webhook secret exists
       const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
       if (!webhookSecret) {
        throw new Error("CLERK_WEBHOOK_SECRET is not configured in environment variables");
      }
// Get Svix headers
       const svix_id = request.headers.get("svix-id");
       const svix_timestamp = request.headers.get("svix-timestamp");
       const svix_signature = request.headers.get("svix-signature");
       // Validate Svix headers
       if (!svix_id || !svix_timestamp || !svix_signature){
        return new Response("Error occured --no svix headers",{
            status:400,
        })
       }
       const payLoad = await request.json();
       const body  = JSON.stringify(payLoad);
       const wh = new Webhook(webhookSecret);
       let evt: WebhookEvent;
       // Verify webhook signature
       try{
        evt = wh.verify(body,{
            "svix-id":svix_id,
            "svix-timestamp":svix_timestamp,
            "svix-signature":svix_signature
        }) as WebhookEvent;
       }catch(err){
        console.log("Error verifying webhook",err)
        return new Response("Error occured --invalid svix headers",{
            status:400,
        })
       }
       const eventType = evt.type;
       if(eventType==="user.created"){
        //save the user to convex db
        const {id,email_addresses,first_name,last_name} = evt.data;
        const email = email_addresses[0].email_address;
        const name = `${first_name || ""} ${last_name || ""}`.trim();
        try {
           await ctx.runMutation(api.users.syncUser,{
            userId:id,
            email,
            name,
           })
        } catch (error) {
            console.log("Error saving user",error)
            return new Response("Error occured --failed to save user",{
                status:500,
            })
        }
       }
       return new Response("webhook processed successfully",{
        status:200,
       })
    })

  });

export default http;